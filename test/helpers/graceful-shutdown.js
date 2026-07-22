/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('graceful shutdown: sequential handler ordering', () => {
  it('sqlite.js should use a single customHandler (not parallel array)', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../sqlite.js'),
      'utf8'
    );
    // Should have exactly one handler in customHandlers array
    const matches = src.match(/customHandlers:\s*\[\s*\n\s*\/\//);
    assert.ok(matches, 'customHandlers should start with a comment block');

    // Should NOT have multiple top-level handlers separated by commas
    // Count occurrences of `async () => {` or `() => {` at the top level of customHandlers
    const handlerSection = src.slice(
      src.indexOf('customHandlers:'),
      src.indexOf('graceful.listen()')
    );
    const topLevelHandlers = handlerSection.match(
      /^\s{4}(?:async\s+)?\(\)\s*=>\s*{/gm
    );
    assert.equal(
      topLevelHandlers.length,
      1,
      'should have exactly one top-level handler (sequential)'
    );
  });

  it('sqlite.js shutdown should set isClosing before draining', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../sqlite.js'),
      'utf8'
    );
    const isClosingIdx = src.indexOf('sqlite.isClosing = true');
    const drainIdx = src.indexOf('drainStart');
    const wssCloseIdx = src.indexOf('sqlite.wss.close');

    assert.ok(isClosingIdx > 0, 'should set isClosing');
    assert.ok(drainIdx > 0, 'should have drain logic');
    assert.ok(wssCloseIdx > 0, 'should close wss');

    // Verify ordering: isClosing < drain < wss.close
    assert.ok(
      isClosingIdx < drainIdx,
      'isClosing should be set before drain starts'
    );
    assert.ok(drainIdx < wssCloseIdx, 'drain should complete before wss.close');
  });

  it('imap.js should use a single customHandler (not parallel array)', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../imap.js'), 'utf8');
    const handlerSection = src.slice(
      src.indexOf('customHandlers:'),
      src.indexOf('graceful.listen()')
    );
    const topLevelHandlers = handlerSection.match(
      /^\s{4}(?:async\s+)?\(\)\s*=>\s*{/gm
    );
    assert.equal(
      topLevelHandlers.length,
      1,
      'should have exactly one top-level handler (sequential)'
    );
  });

  it('imap.js should set isClosing before closing wsp', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../imap.js'), 'utf8');
    const isClosingIdx = src.indexOf('imap.isClosing = true');
    const wspCloseIdx = src.indexOf('wsp.close()');

    assert.ok(isClosingIdx > 0, 'should set isClosing');
    assert.ok(wspCloseIdx > 0, 'should close wsp');
    assert.ok(
      isClosingIdx < wspCloseIdx,
      'isClosing should be set before wsp.close'
    );
  });

  it('sqlite.js should poll refcounts before closing databases', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../sqlite.js'),
      'utf8'
    );
    assert.ok(
      src.includes('entry.refcount'),
      'should check refcount during drain'
    );
    assert.ok(src.includes('activeRefs'), 'should track active references');
    assert.ok(
      src.includes('drainTimeout'),
      'should have a drain timeout to prevent infinite wait'
    );
  });
});
