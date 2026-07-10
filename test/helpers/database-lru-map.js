/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const test = require('ava');

const DatabaseLRUMap = require('#helpers/database-lru-map');

function makeDb(opts = {}) {
  return { open: true, inTransaction: false, pragma() {}, close() {}, ...opts };
}

test.afterEach((t) => {
  if (t.context.map) t.context.map.destroy();
});

// --- Constructor ---

test('constructor > defaults maxSize to 500', (t) => {
  const map = new DatabaseLRUMap();
  t.context.map = map;
  t.is(map.maxSize, 500);
});

test('constructor > accepts custom options', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  t.is(map.maxSize, 10);
});

// --- get/set/has/size/delete ---

test('set/get > stores and retrieves db', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  const db = makeDb();
  map.set('key1', db);
  t.is(map.get('key1'), db);
});

test('get > returns undefined for missing key', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  t.is(map.get('missing'), undefined);
});

test('get > updates lastAccess (LRU touch)', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  map.set('key1', makeDb());
  // Set lastAccess to the past
  map._map.get('key1').lastAccess = Date.now() - 5000;
  // get() should refresh it to ~now
  map.get('key1');
  t.true(map._map.get('key1').lastAccess > Date.now() - 1000);
});

test('has > returns true for existing key', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  map.set('key1', makeDb());
  t.true(map.has('key1'));
});

test('has > returns false for missing key', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  t.false(map.has('missing'));
});

test('size > returns number of entries', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  map.set('a', makeDb());
  map.set('b', makeDb());
  t.is(map.size, 2);
});

test('delete > removes entry and closes db', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  const db = makeDb();
  map.set('key1', db);
  const result = map.delete('key1');
  t.true(result);
  t.false(map.has('key1'));
  t.is(map.size, 0);
});

test('delete > returns false for missing key', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  t.false(map.delete('missing'));
});

// --- Batch eviction on capacity overflow ---

test('set > batch-evicts 10% of capacity when full', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  // Fill to capacity
  for (let i = 0; i < 10; i++) {
    map.set(`key${i}`, makeDb());
    // Make older entries have older lastAccess
    map._map.get(`key${i}`).lastAccess = Date.now() - (10 - i) * 1000;
  }

  t.is(map.size, 10);
  // Adding one more should batch-evict ceil(10 * 0.1) = 1 oldest entry
  map.set('new', makeDb());
  t.true(map.has('new'));
  // key0 was the oldest, should be evicted
  t.false(map.has('key0'));
  t.is(map.size, 10);
});

test('set > does not evict entries in transaction', (t) => {
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

test('set > updates existing entry without eviction', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 2 });
  t.context.map = map;
  const db1 = makeDb();
  const db2 = makeDb();
  map.set('a', db1);
  map.set('a', db2);
  t.is(map.get('a'), db2);
  t.is(map.size, 1);
});

// --- Idle sweep ---

test('_sweepIdle > evicts idle entries past TTL', async (t) => {
  const map = new DatabaseLRUMap({
    maxSize: 10,
    idleTTL: 50
  });
  t.context.map = map;
  map.set('idle1', makeDb());
  map.set('idle2', makeDb());
  // Wait for TTL to expire
  await new Promise((resolve) => {
    setTimeout(resolve, 60);
  });
  map._sweepIdle();
  t.is(map.size, 0);
});

test('_sweepIdle > does not evict entries in transaction', async (t) => {
  const map = new DatabaseLRUMap({
    maxSize: 10,
    idleTTL: 50
  });
  t.context.map = map;
  map.set('active', makeDb({ inTransaction: true }));
  map.set('idle', makeDb());
  await new Promise((resolve) => {
    setTimeout(resolve, 60);
  });
  map._sweepIdle();
  t.true(map.has('active'));
  t.false(map.has('idle'));
});

test('_sweepIdle > does not evict recently accessed entries', (t) => {
  const map = new DatabaseLRUMap({
    maxSize: 10,
    idleTTL: 100
  });
  t.context.map = map;
  map.set('fresh', makeDb());
  map.set('stale', makeDb());
  // Make stale old, keep fresh recent
  map._map.get('stale').lastAccess = Date.now() - 200;
  map._sweepIdle();
  t.true(map.has('fresh'));
  t.false(map.has('stale'));
});

// --- closeAll ---

test('closeAll > closes all databases and clears map', async (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  const db1 = makeDb();
  const db2 = makeDb();
  map.set('a', db1);
  map.set('b', db2);
  await map.closeAll();
  t.is(map.size, 0);
});

// --- destroy ---

test('destroy > nullifies sweep interval', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  map.destroy();
  t.is(map._sweepInterval, null);
});

// --- keys ---

test('keys > returns iterator of all keys', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  map.set('a', makeDb());
  map.set('b', makeDb());
  const keys = [...map.keys()];
  t.deepEqual(keys, ['a', 'b']);
});

// --- Drop-in Map compatibility ---

test('drop-in > get() returns raw db object (not entry wrapper)', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  const db = makeDb();
  map.set('key', db);
  const result = map.get('key');
  t.is(result, db);
  t.true(result.open);
});

test('drop-in > set() returns this for chaining', (t) => {
  const map = new DatabaseLRUMap({ maxSize: 10 });
  t.context.map = map;
  const result = map.set('key', makeDb());
  t.is(result, map);
});
