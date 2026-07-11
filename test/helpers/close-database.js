/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const test = require('ava');
const sinon = require('sinon');

const closeDatabase = require('#helpers/close-database');

test.beforeEach((t) => {
  t.context.db = {
    open: true,
    inTransaction: false,
    pragma: sinon.stub(),
    close: sinon.stub()
  };
});

test('closeDatabase > returns immediately if db is null', async (t) => {
  await closeDatabase(null);
  t.pass();
});

test('closeDatabase > returns immediately if db is undefined', async (t) => {
  await closeDatabase(undefined);
  t.pass();
});

test('closeDatabase > returns immediately if db.open is false', async (t) => {
  const db = { open: false, pragma: sinon.stub(), close: sinon.stub() };
  await closeDatabase(db);
  t.false(db.pragma.called);
  t.false(db.close.called);
});

test('closeDatabase > calls close on healthy db', async (t) => {
  const { db } = t.context;
  await closeDatabase(db);
  t.true(db.close.calledOnce);
});

test('closeDatabase > calls PASSIVE checkpoint but NOT optimize', async (t) => {
  const { db } = t.context;
  await closeDatabase(db);
  // Should call wal_checkpoint(PASSIVE) before close
  t.true(db.pragma.calledOnce);
  t.is(db.pragma.firstCall.args[0], 'wal_checkpoint(PASSIVE)');
  // Should NOT call optimize (was root cause of IOERR_SHORT_READ)
  t.false(db.pragma.calledWith('optimize'));
  t.false(db.pragma.calledWith('analysis_limit=400'));
});

test('closeDatabase > handles close() throwing', async (t) => {
  const { db } = t.context;
  db.close.throws(new Error('close failed'));
  await closeDatabase(db);
  t.true(db.close.calledOnce);
});

test('closeDatabase > waits for inTransaction to clear', async (t) => {
  const { db } = t.context;
  db.inTransaction = true;
  // Simulate transaction completing after 50ms
  setTimeout(() => {
    db.inTransaction = false;
  }, 50);
  await closeDatabase(db);
  t.true(db.close.calledOnce);
});

test('closeDatabase > closes even if inTransaction never clears (30s timeout)', async (t) => {
  t.timeout(35000);
  const { db } = t.context;
  db.inTransaction = true;
  // Never clears - should timeout and still attempt close
  await closeDatabase(db);
  t.true(db.close.calledOnce);
});
