//
// Copyright (c) Forward Email LLC
// SPDX-License-Identifier: BUSL-1.1
//

const test = require('ava');
const sinon = require('sinon');

const safeFetch = require('#helpers/safe-fetch');

test('requires a Tangerine resolver', async (t) => {
  const error = await t.throwsAsync(safeFetch('https://example.com'));

  t.true(error instanceof TypeError);
  t.is(error.message, 'safeFetch requires a Tangerine resolver');
});

test('rejects failed Tangerine DNS resolution', async (t) => {
  const resolver = { resolve4: sinon.stub().resolves([]) };
  const error = await t.throwsAsync(
    safeFetch('https://example.com', { resolver })
  );

  t.true(resolver.resolve4.calledOnceWithExactly('example.com'));
  t.is(error.message, 'DNS resolution failed for example.com');
});

test('rejects private addresses returned by Tangerine', async (t) => {
  const resolver = { resolve4: sinon.stub().resolves(['127.0.0.1']) };
  const error = await t.throwsAsync(
    safeFetch('https://example.com', { resolver })
  );

  t.true(resolver.resolve4.calledOnceWithExactly('example.com'));
  t.is(error.message, 'Resolved IP for example.com is a private address');
});
