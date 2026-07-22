/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const fs = require('node:fs');
const path = require('node:path');
const test = require('ava');

const src = fs.readFileSync(
  path.join(__dirname, '../../helpers/get-temporary-database.js'),
  'utf8'
);

test('should export a function', (t) => {
  t.true(
    src.includes('module.exports = getTemporaryDatabase'),
    'should export getTemporaryDatabase'
  );
  t.true(
    src.includes('async function getTemporaryDatabase(session)'),
    'should be an async function'
  );
});

test('should throw ServerShutdownError when isClosing is true', (t) => {
  t.true(
    src.includes('if (this.isClosing) throw new ServerShutdownError()'),
    'should check isClosing at the top'
  );
});

test('should return cached db from temporaryDatabaseMap if available and open', (t) => {
  t.true(
    src.includes('this.temporaryDatabaseMap.has(cacheKey)'),
    'should check temporaryDatabaseMap'
  );
  t.true(
    src.includes('if (cached && cached.open) return cached'),
    'should return cached db if open'
  );
});

test('should remove stale entries from temporaryDatabaseMap', (t) => {
  t.true(
    src.includes('this.temporaryDatabaseMap.delete(cacheKey)'),
    'should delete stale entries'
  );
});

test('should deduplicate concurrent opens via _tmpDbOpenInflight', (t) => {
  t.true(
    src.includes('const _tmpDbOpenInflight = new Map()'),
    'should declare _tmpDbOpenInflight Map at module level'
  );
  t.true(
    src.includes('if (_tmpDbOpenInflight.has(cacheKey))'),
    'should check if open is already in-flight'
  );
  t.true(
    src.includes('return _tmpDbOpenInflight.get(cacheKey)'),
    'should return existing promise if in-flight'
  );
  t.true(
    src.includes('_tmpDbOpenInflight.set(cacheKey, openPromise)'),
    'should store open promise in inflight map'
  );
  t.true(
    src.includes('_tmpDbOpenInflight.delete(cacheKey)'),
    'should clean up inflight map in finally block'
  );
});

test('should close db handle on setupPragma failure to prevent fd leak', (t) => {
  t.true(
    src.includes('await setupPragma(tmpDb, tmpSession)'),
    'should call setupPragma'
  );
  t.true(
    src.includes('} catch (pragmaErr)'),
    'should catch setupPragma errors'
  );
  t.true(src.includes('tmpDb.close()'), 'should close tmpDb on pragma error');
});

test('should store opened db in temporaryDatabaseMap', (t) => {
  t.true(
    src.includes('this.temporaryDatabaseMap.set(cacheKey, tmpDb)'),
    'should cache the opened db'
  );
});

test('should set synchronous=NORMAL for temp databases', (t) => {
  t.true(
    src.includes("tmpDb.pragma('synchronous=NORMAL')"),
    'should use NORMAL synchronous mode for temp DBs'
  );
});
