/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const { boolean } = require('boolean');
const ms = require('ms');
const pWaitFor = require('p-wait-for');

const env = require('#config/env');
const logger = require('#helpers/logger');

async function closeDatabase(db) {
  if (!db || !db.open) return;

  const t0 = boolean(env.SQLITE_DEBUG_TIMERS) ? Date.now() : 0;

  if (db.inTransaction) {
    try {
      await pWaitFor(() => !db.inTransaction, {
        timeout: ms('30s')
      });
    } catch (err) {
      err.message = `Shutdown could not cancel transaction: ${err.message}`;
      err.isCodeBug = true;
      logger.error(err, { db });
    }
  }

  //
  // NOTE: PRAGMA optimize is intentionally disabled here.
  //
  // It was the root cause of SQLITE_IOERR_SHORT_READ errors in production:
  // optimize runs ANALYZE (full table scans to rebuild index statistics) which
  // causes heavy disk reads. When another PM2 worker is mid-write on the same
  // WAL file, the concurrent read produces IOERR_SHORT_READ. With 50 DBs being
  // swept per cycle, this created I/O storms that blocked the event loop and
  // caused WebSocket broadcast stalls.
  //
  // If query planner statistics are needed, run PRAGMA optimize on a scheduled
  // worker (e.g. sqlite-worker.js) during low-traffic hours, or run it once on
  // database open with: db.pragma('optimize(0x10002)') which only analyzes
  // tables whose stats are >25% stale.
  //
  // try {
  //   db.pragma('analysis_limit=400');
  //   db.pragma('optimize');
  // } catch (err) {
  //   logger.error(err, { db });
  // }
  //

  try {
    db.close();
  } catch (err) {
    logger.error(err, { db });
  }

  if (boolean(env.SQLITE_DEBUG_TIMERS)) {
    console.debug('closeDatabase', {
      duration_ms: Date.now() - t0
    });
  }
}

module.exports = closeDatabase;
