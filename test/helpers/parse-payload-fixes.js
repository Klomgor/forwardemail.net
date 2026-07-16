/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const test = require('ava');

const DatabaseLRUMap = require('#helpers/database-lru-map');

test.afterEach((t) => {
  if (t.context.map) t.context.map.destroy();
});

function makeDb(opts = {}) {
  return { open: true, inTransaction: false, pragma() {}, close() {}, ...opts };
}

// --- inTransaction protection (replaces ref/unref) ---

test('inTransaction > prevents eviction during sweep', async (t) => {
  const map = new DatabaseLRUMap({
    maxSize: 10,
    idleTTL: 50
  });
  t.context.map = map;
  const db = makeDb({ inTransaction: true });
  map.set('alias-1', db);

  // Wait for TTL to expire
  await new Promise((resolve) => {
    setTimeout(resolve, 60);
  });
  map._sweepIdle();

  // Should NOT be evicted because inTransaction is true
  t.true(map.has('alias-1'));
  t.true(db.open);

  // After transaction completes, next sweep should evict
  db.inTransaction = false;
  map._sweepIdle();
  t.false(map.has('alias-1'));
});

test('inTransaction > prevents eviction during capacity overflow', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 2 });
  t.context.map = map;
  map.set('a', makeDb({ inTransaction: true }));
  map.set('b', makeDb());
  // Make 'a' the oldest
  map._map.get('a').lastAccess = Date.now() - 2000;
  map._map.get('b').lastAccess = Date.now() - 1000;
  // 'a' is oldest but in transaction, so 'b' gets evicted
  map.set('c', makeDb());
  t.true(map.has('a'));
  t.false(map.has('b'));
  t.true(map.has('c'));
});

test('get() touch > prevents idle eviction of active databases', (t) => {
  const map = new DatabaseLRUMap({
    maxSize: 10,
    idleTTL: 100
  });
  t.context.map = map;
  map.set('active', makeDb());
  map.set('idle', makeDb());

  // Simulate active use: keep touching 'active' while 'idle' goes stale
  map._map.get('idle').lastAccess = Date.now() - 200;
  map.get('active'); // refreshes lastAccess

  map._sweepIdle();
  t.true(map.has('active'));
  t.false(map.has('idle'));
});

// --- databaseMap fallback (re-check before tmp write) ---

test('databaseMap fallback > re-check finds open db before tmp write', (t) => {
  // Simulates the parse-payload fallback path:
  // If databaseMap has an open DB for the alias, use it instead of tmp
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  const db = makeDb();
  const aliasId = 'alias-123';
  map.set(aliasId, db);

  // Simulate the re-check logic from parse-payload.js
  let usedMainDb = false;
  if (map.has(aliasId) && map.get(aliasId).open === true) {
    usedMainDb = true;
  }

  t.true(usedMainDb);
});

test('databaseMap fallback > falls through to tmp when db not in map', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  const aliasId = 'alias-missing';

  let usedMainDb = false;
  if (map.has(aliasId) && map.get(aliasId).open === true) {
    usedMainDb = true;
  }

  t.false(usedMainDb);
});

test('databaseMap fallback > falls through to tmp when db is closed', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  const aliasId = 'alias-closed';
  map.set(aliasId, makeDb({ open: false }));

  let usedMainDb = false;
  if (map.has(aliasId) && map.get(aliasId).open === true) {
    usedMainDb = true;
  }

  t.false(usedMainDb);
});

// --- Configuration ---

test('ecosystem-sqlite.json > max_memory_restart is 16G', (t) => {
  const ecosystem = require('../../ecosystem-sqlite.json');
  const app = ecosystem.apps.find((a) => a.name === 'sqlite');
  t.is(app.max_memory_restart, '16G');
});

test('setup-pragma > cache_size is 16MB for main databases', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/setup-pragma.js'),
    'utf8'
  );
  // Default is 16384 KiB = 16MB (configurable via SQLITE_CACHE_SIZE_KB env)
  t.true(content.includes('16384'));
});

test('get-temporary-database > cache_size override is 2MB for temp databases', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/get-temporary-database.js'),
    'utf8'
  );
  // cache_size=-2048 means 2048 KiB = 2MB (temp DB override)
  t.true(
    content.includes('cache_size = -2048') ||
      content.includes('cache_size=-2048')
  );
});

// --- Rate limiting overhaul ---

test('rate limiting > BURST_LIMIT_PER_MINUTE is 50', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/parse-payload.js'),
    'utf8'
  );
  t.true(content.includes('const BURST_LIMIT_PER_MINUTE = 50;'));
});

test('rate limiting > RECIPIENT_DAILY_LIMIT is 100,000', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/parse-payload.js'),
    'utf8'
  );
  t.true(content.includes('const RECIPIENT_DAILY_LIMIT = 100_000;'));
});

test('rate limiting > BURST_INCR_SCRIPT only sets TTL on first increment', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/parse-payload.js'),
    'utf8'
  );
  // The Lua script checks "if count == 1 then" before setting PEXPIRE
  // This ensures TTL is only set on the first message (fixed window)
  t.true(content.includes('if count == 1 then'));
  t.true(content.includes("redis.call('PEXPIRE', KEYS[1], ARGV[1])"));
  // Verify it's inside the BURST_INCR_SCRIPT constant
  const scriptStart = content.indexOf('const BURST_INCR_SCRIPT');
  const scriptEnd = content.indexOf('`;', scriptStart);
  // eslint-disable-next-line unicorn/prefer-set-has
  const script = content.slice(scriptStart, scriptEnd);
  t.true(script.includes('if count == 1 then'));
  t.true(script.includes('PEXPIRE'));
});

test('rate limiting > SAFE_DECR_SCRIPT floors at zero', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/parse-payload.js'),
    'utf8'
  );
  // The Lua script checks "if v and tonumber(v) > 0" before decrementing
  // If the value is 0 or nil, it returns 0 instead of going negative
  const scriptStart = content.indexOf('const SAFE_DECR_SCRIPT');
  const scriptEnd = content.indexOf('`;', scriptStart);
  // eslint-disable-next-line unicorn/prefer-set-has
  const script = content.slice(scriptStart, scriptEnd);
  t.true(script.includes('tonumber(v) > 0'));
  t.true(script.includes("redis.call('DECR', KEYS[1])"));
  t.true(script.includes('return 0'));
});

test('rate limiting > SAFE_DECRBY_SCRIPT floors at zero', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/parse-payload.js'),
    'utf8'
  );
  // The Lua script checks "if v and tonumber(v) >= tonumber(ARGV[1])"
  const scriptStart = content.indexOf('const SAFE_DECRBY_SCRIPT');
  const scriptEnd = content.indexOf('`;', scriptStart);
  // eslint-disable-next-line unicorn/prefer-set-has
  const script = content.slice(scriptStart, scriptEnd);
  t.true(script.includes('tonumber(v) >= tonumber(ARGV[1])'));
  t.true(script.includes("redis.call('DECRBY', KEYS[1], ARGV[1])"));
  t.true(script.includes('return 0'));
});

test('rate limiting > enforcement block determines senderTier upfront', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/parse-payload.js'),
    'utf8'
  );
  // Verify the tiered system is implemented
  t.true(content.includes('let senderTier = 3;'));
  t.true(content.includes('senderTier = 1;'));
  t.true(content.includes('senderTier = 2;'));
  // Tier 3 only gets burst + per-domain
  t.true(content.includes('if (senderTier === 3)'));
});

test('rate limiting > per-recipient cap uses rcptCount and RECIPIENT_DAILY_LIMIT', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/parse-payload.js'),
    'utf8'
  );
  t.true(content.includes('rcptCount > RECIPIENT_DAILY_LIMIT'));
  // Verify the rcptKey uses aliasId
  t.true(content.includes('imap_rcpt_count_'));
  // eslint-disable-next-line no-template-curly-in-string
  t.true(content.includes('${aliasId}'));
});

test('rate limiting > decrementRateLimiting does NOT decrement burst or recipient', (t) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const content = fs.readFileSync(
    path.join(__dirname, '../../helpers/parse-payload.js'),
    'utf8'
  );
  // Find the decrementRateLimiting function
  const fnStart = content.indexOf('async function decrementRateLimiting');
  const fnEnd = content.indexOf('\n}', fnStart) + 2;
  // eslint-disable-next-line unicorn/prefer-set-has
  const fn = content.slice(fnStart, fnEnd);
  // Should NOT contain burstKey or rcptKey
  t.false(fn.includes('burstKey'));
  t.false(fn.includes('rcptKey'));
  // Should use SAFE_DECR and SAFE_DECRBY scripts
  t.true(fn.includes('SAFE_DECRBY_SCRIPT'));
  t.true(fn.includes('SAFE_DECR_SCRIPT'));
});
