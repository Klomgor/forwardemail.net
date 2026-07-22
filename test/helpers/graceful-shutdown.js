/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const fs = require('node:fs');
const path = require('node:path');
const test = require('ava');

// --- sqlite.js shutdown tests ---

test('sqlite.js should use a single customHandler (not parallel array)', (t) => {
  const src = fs.readFileSync(path.join(__dirname, '../../sqlite.js'), 'utf8');
  // Should have exactly one handler in customHandlers array
  const handlerSection = src.slice(
    src.indexOf('customHandlers:'),
    src.indexOf('graceful.listen()')
  );
  const topLevelHandlers = handlerSection.match(
    /^\s{4}(?:async\s+)?\(\)\s*=>\s*{/gm
  );
  t.is(
    topLevelHandlers.length,
    1,
    'should have exactly one top-level handler (sequential)'
  );
});

test('sqlite.js shutdown should set isClosing before draining', (t) => {
  const src = fs.readFileSync(path.join(__dirname, '../../sqlite.js'), 'utf8');
  const isClosingIdx = src.indexOf('sqlite.isClosing = true');
  const drainIdx = src.indexOf('drainStart');
  const wssCloseIdx = src.indexOf('sqlite.wss.close');

  t.true(isClosingIdx > 0, 'should set isClosing');
  t.true(drainIdx > 0, 'should have drain logic');
  t.true(wssCloseIdx > 0, 'should close wss');

  // Verify ordering: isClosing < drain < wss.close
  t.true(
    isClosingIdx < drainIdx,
    'isClosing should be set before drain starts'
  );
  t.true(drainIdx < wssCloseIdx, 'drain should complete before wss.close');
});

test('sqlite.js should poll refcounts before closing databases', (t) => {
  const src = fs.readFileSync(path.join(__dirname, '../../sqlite.js'), 'utf8');
  t.true(src.includes('entry.refcount'), 'should check refcount during drain');
  t.true(src.includes('activeRefs'), 'should track active references');
  t.true(
    src.includes('drainTimeout'),
    'should have a drain timeout to prevent infinite wait'
  );
});

// --- imap.js shutdown tests ---

test('imap.js should use a single customHandler (not parallel array)', (t) => {
  const src = fs.readFileSync(path.join(__dirname, '../../imap.js'), 'utf8');
  const handlerSection = src.slice(
    src.indexOf('customHandlers:'),
    src.indexOf('graceful.listen()')
  );
  const topLevelHandlers = handlerSection.match(
    /^\s{4}(?:async\s+)?\(\)\s*=>\s*{/gm
  );
  t.is(
    topLevelHandlers.length,
    1,
    'should have exactly one top-level handler (sequential)'
  );
});

test('imap.js should set isClosing before closing wsp', (t) => {
  const src = fs.readFileSync(path.join(__dirname, '../../imap.js'), 'utf8');
  const isClosingIdx = src.indexOf('imap.isClosing = true');
  const wspCloseIdx = src.indexOf('wsp.close()');

  t.true(isClosingIdx > 0, 'should set isClosing');
  t.true(wspCloseIdx > 0, 'should close wsp');
  t.true(
    isClosingIdx < wspCloseIdx,
    'isClosing should be set before wsp.close'
  );
});
