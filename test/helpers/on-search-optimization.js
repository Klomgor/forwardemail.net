/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { Builder } = require('json-sql-enhanced');

const builder = new Builder({ bufferAsNative: true });

describe('onSearch optimization: ID injection into SQL', () => {
  it('should produce IN clause for small ID sets (<= 900)', () => {
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

    assert.ok(sql.query.includes('"_id" in ('));
    assert.ok(sql.query.includes('$p'));
    // All IDs should be in values
    const vals = Object.values(sql.values);
    assert.ok(vals.includes('id1'));
    assert.ok(vals.includes('id2'));
    assert.ok(vals.includes('id3'));
  });

  it('should chunk IDs into multiple IN clauses for large sets (> 900)', () => {
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
    assert.ok(sql.query.includes(' or '));
    // Should have all 1800 IDs as parameters
    assert.equal(Object.keys(sql.values).length, 1801); // 1800 ids + 1 mailbox
  });

  it('should combine ID filter with other conditions', () => {
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
    assert.ok(sql.query.includes('"uid" >='));
    assert.ok(sql.query.includes('"_id" in ('));
  });

  it('should produce correct SQL when no IDs are injected (no mustIncludeIds)', () => {
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
    assert.ok(!sql.query.includes('"_id" in ('));
    // Should have the seen condition
    assert.ok(sql.query.includes('"seen"'));
  });
});
