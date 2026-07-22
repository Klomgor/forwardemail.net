/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const test = require('ava');
const { Builder } = require('json-sql-enhanced');

const builder = new Builder({ bufferAsNative: true });

test('should produce IN clause for small ID sets (<= 900)', (t) => {
  const ids = ['id1', 'id2', 'id3'];
  const condition = {
    mailbox: 'mb1',
    $and: [{ _id: { $in: ids } }]
  };

  const sql = builder.build({
    type: 'select',
    table: 'Messages',
    condition,
    fields: ['_id', 'uid', 'modseq']
  });

  t.true(sql.query.includes('"_id" in ('));
  t.true(sql.query.includes('$p'));
  // All IDs should be in values
  const vals = Object.values(sql.values);
  t.true(vals.includes('id1'));
  t.true(vals.includes('id2'));
  t.true(vals.includes('id3'));
});

test('should chunk IDs into multiple IN clauses for large sets (> 900)', (t) => {
  // Generate 1800 IDs to test chunking
  const ids = [];
  for (let i = 0; i < 1800; i++) {
    ids.push(`id_${i}`);
  }

  // Simulate the chunking logic from on-search.js
  const $and = [];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 900) {
    chunks.push({ _id: { $in: ids.slice(i, i + 900) } });
  }

  $and.push({ $or: chunks });

  const condition = {
    mailbox: 'mb1',
    $and
  };

  const sql = builder.build({
    type: 'select',
    table: 'Messages',
    condition,
    fields: ['_id', 'uid', 'modseq']
  });

  // Should have OR with two IN clauses
  t.true(sql.query.includes(' or '));
  // Should have all 1800 IDs as parameters
  t.is(Object.keys(sql.values).length, 1801); // 1800 ids + 1 mailbox
});

test('should combine ID filter with other conditions', (t) => {
  const ids = ['id1', 'id2'];
  const condition = {
    mailbox: 'mb1',
    $and: [{ uid: { $gte: 5 } }, { _id: { $in: ids } }]
  };

  const sql = builder.build({
    type: 'select',
    table: 'Messages',
    condition,
    fields: ['_id', 'uid', 'modseq']
  });

  // Should have both the uid condition and the IN clause
  t.true(sql.query.includes('"uid" >='));
  t.true(sql.query.includes('"_id" in ('));
});

test('should produce correct SQL when no IDs are injected (no mustIncludeIds)', (t) => {
  const condition = {
    mailbox: 'mb1',
    $and: [{ seen: true }]
  };

  const sql = builder.build({
    type: 'select',
    table: 'Messages',
    condition,
    fields: ['_id', 'uid', 'modseq']
  });

  // Should NOT have IN clause
  t.true(!sql.query.includes('"_id" in ('));
  // Should have the seen condition
  t.true(sql.query.includes('"seen"'));
});
