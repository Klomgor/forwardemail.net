const fs = require('node:fs');
const path = require('node:path');

const test = require('ava');

//
// Static analysis tests: verify that on-store, on-copy, and on-move
// implement the single-message .get() fast path correctly.
//
// These tests read the source files and verify the presence of the
// optimization patterns without requiring full IMAP server setup.
//

const HELPERS_DIR = path.join(__dirname, '..', '..', 'helpers', 'imap');

const onStoreSource = fs.readFileSync(
  path.join(HELPERS_DIR, 'on-store.js'),
  'utf8'
);
const onCopySource = fs.readFileSync(
  path.join(HELPERS_DIR, 'on-copy.js'),
  'utf8'
);
const onMoveSource = fs.readFileSync(
  path.join(HELPERS_DIR, 'on-move.js'),
  'utf8'
);

// ─── on-store.js ────────────────────────────────────────────────────────────

test('on-store > detects single-message via condition.uid.$eq', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onStoreSource.indexOf('condition?.uid?.$eq') !== -1);
});

test('on-store > uses .get() for single-message path', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onStoreSource.indexOf('.get(sql.values)') !== -1);
});

test('on-store > uses .all() for multi-message path', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onStoreSource.indexOf('.all(sql.values)') !== -1);
});

test('on-store > skips sort for single-message', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onStoreSource.indexOf('sort: isSingleMessage ? undefined') !== -1);
});

test('on-store > wraps .get() result in array for uniform iteration', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onStoreSource.indexOf('row ? [row] : []') !== -1);
});

test('on-store > isSingleMessage is a Boolean', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onStoreSource.indexOf('const isSingleMessage = Boolean(') !== -1);
});

// ─── on-copy.js ─────────────────────────────────────────────────────────────

test('on-copy > detects single-message via condition.uid.$eq', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onCopySource.indexOf('condition?.uid?.$eq') !== -1);
});

test('on-copy > uses .get() for single-message path', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onCopySource.indexOf('.get(sql.values)') !== -1);
});

test('on-copy > uses .all() for multi-message path', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onCopySource.indexOf('.all(sql.values)') !== -1);
});

test('on-copy > skips sort for single-message', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onCopySource.indexOf('sort: isSingleMessage ? undefined') !== -1);
});

test('on-copy > wraps .get() result in array for uniform iteration', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onCopySource.indexOf('row ? [row] : []') !== -1);
});

test('on-copy > removes old inefficiency comment', (t) => {
  t.true(
    // eslint-disable-next-line unicorn/prefer-includes
    onCopySource.indexOf('NOTE: this is inefficient but works for now') === -1
  );
});

// ─── on-move.js ─────────────────────────────────────────────────────────────

test('on-move > detects single-message via condition._id or condition.uid.$eq', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onMoveSource.indexOf('condition._id || condition?.uid?.$eq') !== -1);
});

test('on-move > uses .get() for single-message path', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onMoveSource.indexOf('stmt.get(sql.values)') !== -1);
});

test('on-move > uses .iterate() for multi-message path', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onMoveSource.indexOf('stmt.iterate(sql.values)') !== -1);
});

test('on-move > skips sort for single-message', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onMoveSource.indexOf('sort: isSingleMessage ? undefined') !== -1);
});

test('on-move > wraps .get() result in array for uniform iteration', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onMoveSource.indexOf('row ? [row] : []') !== -1);
});

test('on-move > spreads iterate into array for multi-message (needed for deferred transaction)', (t) => {
  // eslint-disable-next-line unicorn/prefer-includes
  t.true(onMoveSource.indexOf('[...stmt.iterate(sql.values)]') !== -1);
});

// ─── Cross-cutting: all three files use the same pattern ────────────────────

test('all handlers > use Boolean() for isSingleMessage detection', (t) => {
  for (const [name, source] of [
    ['on-store', onStoreSource],
    ['on-copy', onCopySource],
    ['on-move', onMoveSource]
  ]) {
    t.true(
      // eslint-disable-next-line unicorn/prefer-includes
      source.indexOf('const isSingleMessage = Boolean(') !== -1,
      `${name} should use Boolean() for isSingleMessage`
    );
  }
});

test('all handlers > skip sort for single-message (ORDER BY is unnecessary for one row)', (t) => {
  for (const [name, source] of [
    ['on-store', onStoreSource],
    ['on-copy', onCopySource],
    ['on-move', onMoveSource]
  ]) {
    t.true(
      // eslint-disable-next-line unicorn/prefer-includes
      source.indexOf('sort: isSingleMessage ? undefined') !== -1,
      `${name} should conditionally skip sort`
    );
  }
});
