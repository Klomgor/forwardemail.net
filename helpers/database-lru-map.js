/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const ms = require('ms');

const closeDatabase = require('#helpers/close-database');
const env = require('#config/env');
const logger = require('#helpers/logger');

//
// LRU Map for SQLite database connections.
//
// The databaseMap previously used a plain Map() with no eviction,
// causing unbounded memory growth (1.8-3.8 GB per worker) as every
// IMAP user's database was opened and never closed until process restart.
//
// This class provides:
// - Max size limit (configurable, default 3000 per worker)
// - Idle TTL (close databases not accessed for 5 minutes)
// - Throttled LRU sweep (max N evictions per cycle to avoid I/O storms)
// - Reference counting (don't evict databases with active operations)
// - Safe async close with transaction awareness
//
class DatabaseLRUMap {
  constructor(options = {}) {
    this.maxSize = options.maxSize || Number(env.DATABASE_MAP_MAX_SIZE) || 3000;
    this.maxEvictionsPerSweep =
      options.maxEvictionsPerSweep ||
      Number(env.DATABASE_MAP_MAX_EVICTIONS_PER_SWEEP) ||
      10;
    this.idleTTL = options.idleTTL || ms('5m');
    this._map = new Map(); // alias_id -> { db, lastAccess, refs }
    this._closing = new Set(); // alias_ids currently being closed

    // Periodic sweep to close idle databases
    this._sweepInterval = setInterval(() => {
      this._sweepIdle();
    }, ms('1m'));
    this._sweepInterval.unref();
  }

  get size() {
    return this._map.size;
  }

  has(key) {
    return this._map.has(key);
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    // Update last access time (LRU touch)
    entry.lastAccess = Date.now();
    return entry.db;
  }

  // Increment reference count (call when starting an operation)
  ref(key) {
    const entry = this._map.get(key);
    if (entry) entry.refs++;
  }

  // Decrement reference count (call when operation completes)
  unref(key) {
    const entry = this._map.get(key);
    if (entry && entry.refs > 0) entry.refs--;
  }

  set(key, db) {
    // If already exists, just update
    if (this._map.has(key)) {
      const entry = this._map.get(key);
      entry.db = db;
      entry.lastAccess = Date.now();
      return this;
    }

    // Evict LRU entries if at capacity
    if (this._map.size >= this.maxSize) {
      this._evictLRU();
    }

    this._map.set(key, {
      db,
      lastAccess: Date.now(),
      refs: 0
    });
    return this;
  }

  delete(key) {
    const entry = this._map.get(key);
    if (!entry) return false;
    this._map.delete(key);
    // Close the database asynchronously (fire-and-forget)
    if (entry.db && entry.db.open) {
      closeDatabase(entry.db).catch((err) => {
        logger.error(err);
      });
    }

    return true;
  }

  // For compatibility with Map iteration (used in graceful shutdown)
  keys() {
    return this._map.keys();
  }

  // For compatibility with graceful shutdown: get raw db by key without LRU touch
  getRaw(key) {
    const entry = this._map.get(key);
    return entry ? entry.db : undefined;
  }

  // Evict the least recently used entry (single entry, called on capacity overflow)
  _evictLRU() {
    let oldestKey = null;
    let oldestTime = Number.POSITIVE_INFINITY;
    for (const [key, entry] of this._map) {
      // Skip entries currently being closed, in transaction, or with active refs
      if (this._closing.has(key)) continue;
      if (entry.db && entry.db.inTransaction) continue;
      if (entry.refs > 0) continue;
      if (entry.db && entry.db.open && entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      const entry = this._map.get(oldestKey);
      this._map.delete(oldestKey);
      if (entry && entry.db && entry.db.open) {
        this._closing.add(oldestKey);
        closeDatabase(entry.db)
          .catch((err) => {
            logger.error(err);
          })
          .finally(() => {
            this._closing.delete(oldestKey);
          });
      }
    }
  }

  // Sweep idle databases that haven't been accessed within TTL
  // Throttled: close at most maxEvictionsPerSweep per cycle
  _sweepIdle() {
    const now = Date.now();
    const toEvict = [];
    for (const [key, entry] of this._map) {
      if (now - entry.lastAccess > this.idleTTL) {
        // Skip entries in transaction
        if (entry.db && entry.db.inTransaction) continue;
        // Skip entries currently being closed
        if (this._closing.has(key)) continue;
        // Skip entries with active references (open operations)
        if (entry.refs > 0) continue;
        // Skip entries whose db is not open (already closed externally)
        if (!entry.db || !entry.db.open) continue;
        toEvict.push(key);
        // Throttle: only evict up to maxEvictionsPerSweep per cycle
        if (toEvict.length >= this.maxEvictionsPerSweep) break;
      }
    }

    for (const key of toEvict) {
      const entry = this._map.get(key);
      this._map.delete(key);
      if (entry && entry.db && entry.db.open) {
        this._closing.add(key);
        closeDatabase(entry.db)
          .catch((err) => {
            logger.error(err);
          })
          .finally(() => {
            this._closing.delete(key);
          });
      }
    }

    if (toEvict.length > 0) {
      logger.debug(`DatabaseLRUMap: swept ${toEvict.length} idle databases`);
    }
  }

  // Graceful shutdown - close all databases
  async closeAll() {
    clearInterval(this._sweepInterval);
    const promises = [];
    for (const entry of this._map.values()) {
      if (entry.db && entry.db.open) {
        promises.push(closeDatabase(entry.db));
      }
    }

    this._map.clear();
    await Promise.allSettled(promises);
  }

  // Destroy the interval (for tests)
  destroy() {
    clearInterval(this._sweepInterval);
  }
}

module.exports = DatabaseLRUMap;
