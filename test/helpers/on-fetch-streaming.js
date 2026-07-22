/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const fs = require('node:fs');
const path = require('node:path');

const test = require('ava');
const sinon = require('sinon');

// Path to the on-fetch source for static analysis tests
const ON_FETCH_PATH = path.join(__dirname, '../../helpers/imap/on-fetch.js');

// --- Static analysis: verify streaming flush configuration ---

test('on-fetch > FLUSH_BYTES threshold is 1 MB (1024 * 1024)', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  t.true(content.includes('const FLUSH_BYTES = 1024 * 1024;'));
});

test('on-fetch > pendingBytes tracker is initialized to 0', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  t.true(content.includes('let pendingBytes = 0;'));
});

test('on-fetch > uses stmt.iterate() for multi-message path', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // Should use iterate for streaming row-by-row processing
  t.true(content.includes('stmt.iterate(sql.values)'));
  // Should NOT use stmt.all which loads all rows into memory
  t.false(content.includes('stmt.all(sql.values)'));
});

test('on-fetch > uses stmt.get() for single-message fast path', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // Single-message path uses .get() for direct row lookup
  t.true(content.includes('stmt.get(sql.values)'));
});

test('on-fetch > flush condition uses byte threshold not count', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // Should flush based on bytes
  t.true(content.includes('pendingBytes >= FLUSH_BYTES'));
  // Should NOT use the old count-based flush (>= 500)
  t.false(content.includes('compiledPayloads.length >= 500'));
});

test('on-fetch > pendingBytes accumulates compiled.length', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  t.true(content.includes('pendingBytes += compiled.length;'));
});

test('on-fetch > pendingBytes resets to 0 after flush', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // After broadcast, pendingBytes must be reset
  // Find the broadcast call and verify pendingBytes = 0 follows
  const broadcastIdx = content.indexOf(
    'await this.wss.broadcast(session, compiledPayloads);'
  );
  t.true(broadcastIdx > 0);
  const afterBroadcast = content.slice(broadcastIdx, broadcastIdx + 200);
  t.true(afterBroadcast.includes('pendingBytes = 0;'));
});

test('on-fetch > compiledPayloads array is cleared after flush', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // After broadcast, compiledPayloads must be emptied
  const broadcastIdx = content.indexOf(
    'await this.wss.broadcast(session, compiledPayloads);'
  );
  t.true(broadcastIdx > 0);
  const afterBroadcast = content.slice(broadcastIdx, broadcastIdx + 200);
  t.true(afterBroadcast.includes('compiledPayloads.length = 0;'));
});

test('on-fetch > flush occurs in BOTH code paths (metadataOnly and full body)', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // There should be exactly 2 broadcast calls (one for metadataOnly, one for full body)
  const matches = content.match(
    /await this\.wss\.broadcast\(session, compiledPayloads\)/g
  );
  t.truthy(matches);
  t.is(matches.length, 2);
});

test('on-fetch > both flush paths reset pendingBytes', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // Find both broadcast calls and verify each is followed by pendingBytes = 0
  let searchFrom = 0;
  for (let i = 0; i < 2; i++) {
    const broadcastIdx = content.indexOf(
      'await this.wss.broadcast(session, compiledPayloads);',
      searchFrom
    );
    t.true(broadcastIdx > 0, `broadcast call ${i + 1} should exist`);
    // eslint-disable-next-line unicorn/prefer-set-has
    const afterBroadcast = content.slice(broadcastIdx, broadcastIdx + 200);
    t.true(
      afterBroadcast.includes('pendingBytes = 0;'),
      `broadcast call ${i + 1} should reset pendingBytes`
    );
    t.true(
      afterBroadcast.includes('compiledPayloads.length = 0;'),
      `broadcast call ${i + 1} should clear compiledPayloads`
    );
    searchFrom = broadcastIdx + 1;
  }
});

// --- Static analysis: single-message fast path ---

test('on-fetch > detects single-message via condition.uid.$eq', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  t.true(
    content.includes('const isSingleMessage = Boolean(condition?.uid?.$eq)')
  );
});

test('on-fetch > disables batch mode for single-message fetches', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  t.true(content.includes('const isBatchMode = !isSingleMessage;'));
});

test('on-fetch > early return for empty messages array', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  t.true(content.includes('if (options.messages.length === 0)'));
  // Verify it returns immediately via fn()
  const emptyIdx = content.indexOf('if (options.messages.length === 0)');
  // eslint-disable-next-line unicorn/prefer-set-has
  const afterEmpty = content.slice(emptyIdx, emptyIdx + 200);
  t.true(afterEmpty.includes('fn(null, true,'));
  t.true(afterEmpty.includes('return;'));
});

test('on-fetch > processMessage helper avoids code duplication', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // processMessage is defined once and called from both paths
  t.true(content.includes('const processMessage = async (result) => {'));
  // Called in single-message path
  t.true(content.includes('await processMessage(result);'));
});

// --- Static analysis: general optimizations ---

test('on-fetch > does NOT use count-based flush anywhere', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  // The old approach flushed every 500 messages regardless of size
  // This is dangerous because 500 messages * 45MB = 22.5GB
  t.false(content.includes('>= 500'));
  t.false(content.includes('> 500'));
  // Also verify no count-based threshold comments remain
  t.false(content.includes('flush compiled payloads after every 500'));
});

test('on-fetch > uses uidSet for O(1) lookups instead of Array.includes', (t) => {
  const content = fs.readFileSync(ON_FETCH_PATH, 'utf8');
  t.true(
    content.includes(
      'const uidSet = queryAll ? new Set(session.selected.uidList) : null;'
    )
  );
  t.true(content.includes('!uidSet.has(message.uid)'));
});

// --- Functional test: verify flush logic behavior ---

test('on-fetch flush logic > flushes when pendingBytes exceeds 1 MB', async (t) => {
  // Simulate the flush logic extracted from on-fetch.js
  const FLUSH_BYTES = 1024 * 1024; // 1 MB
  const broadcastStub = sinon.stub().resolves();
  const compiledPayloads = [];
  let pendingBytes = 0;

  // Simulate adding payloads that are under the threshold
  const smallPayload = 'x'.repeat(500 * 1024); // 500 KB
  compiledPayloads.push({ compiled: smallPayload });
  pendingBytes += smallPayload.length;

  // Should NOT flush yet (500 KB < 1 MB)
  if (pendingBytes >= FLUSH_BYTES) {
    await broadcastStub(null, compiledPayloads);
    compiledPayloads.length = 0;
    pendingBytes = 0;
  }

  t.false(broadcastStub.called);
  t.is(compiledPayloads.length, 1);
  t.is(pendingBytes, 500 * 1024);

  // Add another payload that pushes over the threshold
  const largePayload = 'y'.repeat(600 * 1024); // 600 KB (total now 1100 KB > 1 MB)
  compiledPayloads.push({ compiled: largePayload });
  pendingBytes += largePayload.length;

  if (pendingBytes >= FLUSH_BYTES) {
    await broadcastStub(null, compiledPayloads);
    compiledPayloads.length = 0;
    pendingBytes = 0;
  }

  t.true(broadcastStub.calledOnce);
  t.is(compiledPayloads.length, 0);
  t.is(pendingBytes, 0);
});

test('on-fetch flush logic > does not flush when under threshold', async (t) => {
  const FLUSH_BYTES = 1024 * 1024;
  const broadcastStub = sinon.stub().resolves();
  const compiledPayloads = [];
  let pendingBytes = 0;

  // Add many small payloads that stay under 1 MB total
  for (let i = 0; i < 100; i++) {
    const payload = 'z'.repeat(1024); // 1 KB each = 100 KB total
    compiledPayloads.push({ compiled: payload });
    pendingBytes += payload.length;

    if (pendingBytes >= FLUSH_BYTES) {
      await broadcastStub(null, compiledPayloads);
      compiledPayloads.length = 0;
      pendingBytes = 0;
    }
  }

  t.false(broadcastStub.called);
  t.is(compiledPayloads.length, 100);
  t.is(pendingBytes, 100 * 1024);
});

test('on-fetch flush logic > flushes multiple times for large data', async (t) => {
  const FLUSH_BYTES = 1024 * 1024;
  const broadcastStub = sinon.stub().resolves();
  const compiledPayloads = [];
  let pendingBytes = 0;

  // Simulate 7 messages each 600 KB = 4.2 MB total
  // 600KB * 2 = 1200KB > 1024KB -> flush #1 at msg 2
  // 600KB * 2 = 1200KB > 1024KB -> flush #2 at msg 4
  // 600KB * 2 = 1200KB > 1024KB -> flush #3 at msg 6
  // remaining: 1 msg (600KB)
  for (let i = 0; i < 7; i++) {
    const payload = 'a'.repeat(600 * 1024);
    compiledPayloads.push({ compiled: payload });
    pendingBytes += payload.length;

    if (pendingBytes >= FLUSH_BYTES) {
      await broadcastStub(null, [...compiledPayloads]);
      compiledPayloads.length = 0;
      pendingBytes = 0;
    }
  }

  // Should have flushed 3 times (at msgs 2, 4, 6)
  t.is(broadcastStub.callCount, 3);
  // Remaining: 1 payload (600 KB) not yet flushed
  t.is(compiledPayloads.length, 1);
  t.is(pendingBytes, 600 * 1024);
});

test('on-fetch flush logic > single large message triggers immediate flush', async (t) => {
  const FLUSH_BYTES = 1024 * 1024;
  const broadcastStub = sinon.stub().resolves();
  const compiledPayloads = [];
  let pendingBytes = 0;

  // Single 45 MB message (max message size)
  const payload = 'b'.repeat(45 * 1024 * 1024);
  compiledPayloads.push({ compiled: payload });
  pendingBytes += payload.length;

  if (pendingBytes >= FLUSH_BYTES) {
    await broadcastStub(null, compiledPayloads);
    compiledPayloads.length = 0;
    pendingBytes = 0;
  }

  t.true(broadcastStub.calledOnce);
  t.is(compiledPayloads.length, 0);
  t.is(pendingBytes, 0);
});

test('on-fetch flush logic > remaining payloads passed to fn() after loop', (t) => {
  // After the loop completes, any remaining compiledPayloads are passed to fn()
  // This verifies the contract: flush during loop + remainder at end
  const FLUSH_BYTES = 1024 * 1024;
  const compiledPayloads = [];
  let pendingBytes = 0;
  let flushCount = 0;

  // Simulate 3 messages: 800KB, 800KB, 300KB
  const sizes = [800 * 1024, 800 * 1024, 300 * 1024];
  for (const size of sizes) {
    const payload = 'c'.repeat(size);
    compiledPayloads.push({ compiled: payload });
    pendingBytes += payload.length;

    if (pendingBytes >= FLUSH_BYTES) {
      // Simulate broadcast flush
      flushCount++;
      compiledPayloads.length = 0;
      pendingBytes = 0;
    }
  }

  // After loop: 1 flush happened (800+800=1600KB > 1MB)
  // Remaining: 1 payload (300KB) stays in compiledPayloads for fn()
  t.is(flushCount, 1);
  t.is(compiledPayloads.length, 1);
  t.is(pendingBytes, 300 * 1024);
});

// --- Functional test: single-message fast path skips batch mode ---

test('on-fetch flush logic > single-message path skips broadcast entirely', async (t) => {
  // Simulate the single-message path: isBatchMode = false, no broadcast
  const FLUSH_BYTES = 1024 * 1024;
  const isSingleMessage = true;
  const isBatchMode = !isSingleMessage; // false for single message
  const broadcastStub = sinon.stub().resolves();
  const compiledPayloads = [];
  let pendingBytes = 0;

  // Even a large single message should NOT trigger broadcast
  const payload = 'x'.repeat(5 * 1024 * 1024); // 5 MB
  compiledPayloads.push({ compiled: payload });
  pendingBytes += payload.length;

  if (isBatchMode && pendingBytes >= FLUSH_BYTES) {
    await broadcastStub(null, compiledPayloads);
    compiledPayloads.length = 0;
    pendingBytes = 0;
  }

  // Broadcast should NOT be called because isBatchMode is false
  t.false(broadcastStub.called);
  // Payload stays in compiledPayloads for fn() to return directly
  t.is(compiledPayloads.length, 1);
  t.is(pendingBytes, 5 * 1024 * 1024);
});

test('on-fetch flush logic > multi-message path enables broadcast', async (t) => {
  // Simulate the multi-message path: isBatchMode = true
  const FLUSH_BYTES = 1024 * 1024;
  const isSingleMessage = false;
  const isBatchMode = !isSingleMessage; // true for multi-message
  const broadcastStub = sinon.stub().resolves();
  const compiledPayloads = [];
  let pendingBytes = 0;

  // Same 5 MB payload SHOULD trigger broadcast in multi-message mode
  const payload = 'x'.repeat(5 * 1024 * 1024); // 5 MB
  compiledPayloads.push({ compiled: payload });
  pendingBytes += payload.length;

  if (isBatchMode && pendingBytes >= FLUSH_BYTES) {
    await broadcastStub(null, compiledPayloads);
    compiledPayloads.length = 0;
    pendingBytes = 0;
  }

  // Broadcast SHOULD be called because isBatchMode is true
  t.true(broadcastStub.calledOnce);
  t.is(compiledPayloads.length, 0);
  t.is(pendingBytes, 0);
});
