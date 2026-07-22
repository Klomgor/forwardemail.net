/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('getTemporaryDatabase', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '../../helpers/get-temporary-database.js'),
    'utf8'
  );

  it('should export a function', () => {
    assert.ok(
      src.includes('module.exports = getTemporaryDatabase'),
      'should export getTemporaryDatabase'
    );
    assert.ok(
      src.includes('async function getTemporaryDatabase(session)'),
      'should be an async function'
    );
  });

  it('should throw ServerShutdownError when isClosing is true', () => {
    assert.ok(
      src.includes('if (this.isClosing) throw new ServerShutdownError()'),
      'should check isClosing at the top'
    );
  });

  it('should return cached db from temporaryDatabaseMap if available and open', () => {
    assert.ok(
      src.includes('this.temporaryDatabaseMap.has(cacheKey)'),
      'should check temporaryDatabaseMap'
    );
    assert.ok(
      src.includes('if (cached && cached.open) return cached'),
      'should return cached db if open'
    );
  });

  it('should remove stale entries from temporaryDatabaseMap', () => {
    assert.ok(
      src.includes('this.temporaryDatabaseMap.delete(cacheKey)'),
      'should delete stale entries'
    );
  });

  it('should deduplicate concurrent opens via _tmpDbOpenInflight', () => {
    assert.ok(
      src.includes('const _tmpDbOpenInflight = new Map()'),
      'should declare _tmpDbOpenInflight Map at module level'
    );
    assert.ok(
      src.includes('if (_tmpDbOpenInflight.has(cacheKey))'),
      'should check if open is already in-flight'
    );
    assert.ok(
      src.includes('return _tmpDbOpenInflight.get(cacheKey)'),
      'should return existing promise if in-flight'
    );
    assert.ok(
      src.includes('_tmpDbOpenInflight.set(cacheKey, openPromise)'),
      'should store open promise in inflight map'
    );
    assert.ok(
      src.includes('_tmpDbOpenInflight.delete(cacheKey)'),
      'should clean up inflight map in finally block'
    );
  });

  it('should close db handle on setupPragma failure to prevent fd leak', () => {
    assert.ok(
      src.includes('await setupPragma(tmpDb, tmpSession)'),
      'should call setupPragma'
    );
    assert.ok(
      src.includes('} catch (pragmaErr)'),
      'should catch setupPragma errors'
    );
    assert.ok(
      src.includes('tmpDb.close()'),
      'should close tmpDb on pragma error'
    );
  });

  it('should store opened db in temporaryDatabaseMap', () => {
    assert.ok(
      src.includes('this.temporaryDatabaseMap.set(cacheKey, tmpDb)'),
      'should cache the opened db'
    );
  });

  it('should set synchronous=NORMAL for temp databases', () => {
    assert.ok(
      src.includes("tmpDb.pragma('synchronous=NORMAL')"),
      'should use NORMAL synchronous mode for temp DBs'
    );
  });
});
