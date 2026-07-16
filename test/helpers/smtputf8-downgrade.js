/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const punycode = require('node:punycode');
const test = require('ava');

//
// Replicate the punycodeEnvelopeAddress helper from send-email.js
// for isolated unit testing without pulling in the full dependency tree.
//
function punycodeEnvelopeAddress(address) {
  if (!address || typeof address !== 'string') return address;
  const atIndex = address.lastIndexOf('@');
  if (atIndex === -1) return address;
  const localPart = address.slice(0, atIndex);
  const domainPart = address.slice(atIndex + 1);
  try {
    return `${localPart}@${punycode.toASCII(domainPart)}`;
  } catch {
    return address;
  }
}

//
// punycodeEnvelopeAddress tests
//
test('punycodeEnvelopeAddress converts IDN domain to ACE', (t) => {
  const result = punycodeEnvelopeAddress('user@müller.de');
  t.is(result, 'user@xn--mller-kva.de');
});

test('punycodeEnvelopeAddress preserves ASCII-only addresses', (t) => {
  const result = punycodeEnvelopeAddress('user@example.com');
  t.is(result, 'user@example.com');
});

test('punycodeEnvelopeAddress handles null/undefined gracefully', (t) => {
  t.is(punycodeEnvelopeAddress(null), null);
  t.is(punycodeEnvelopeAddress(undefined), undefined);
  t.is(punycodeEnvelopeAddress(''), '');
});

test('punycodeEnvelopeAddress handles address without @ sign', (t) => {
  t.is(punycodeEnvelopeAddress('nodomain'), 'nodomain');
});

test('punycodeEnvelopeAddress preserves local part with non-ASCII', (t) => {
  // RFC 6531 allows UTF-8 local parts; only the domain should be converted
  const result = punycodeEnvelopeAddress('ünser@münchen.de');
  t.is(result, 'ünser@xn--mnchen-3ya.de');
});

test('punycodeEnvelopeAddress handles multiple @ signs (uses last)', (t) => {
  // edge case: "user@sub"@domain.com - lastIndexOf('@') picks the domain
  const result = punycodeEnvelopeAddress('user@sub@münchen.de');
  t.is(result, 'user@sub@xn--mnchen-3ya.de');
});

test('punycodeEnvelopeAddress handles already-punycoded domain', (t) => {
  const result = punycodeEnvelopeAddress('user@xn--mnchen-3ya.de');
  t.is(result, 'user@xn--mnchen-3ya.de');
});

//
// Header downgrade regex tests (same logic used in on-data-mx.js)
//
const DOWNGRADE_REGEX = /(@)([^@\s>,;]+)/g;

function downgradeHeaderValue(value) {
  return value.replace(DOWNGRADE_REGEX, (match, at, domain) => {
    try {
      return `${at}${punycode.toASCII(domain)}`;
    } catch {
      return match;
    }
  });
}

test('header downgrade converts IDN in simple To header', (t) => {
  const input = 'user@müller.de';
  t.is(downgradeHeaderValue(input), 'user@xn--mller-kva.de');
});

test('header downgrade converts IDN in display name format', (t) => {
  const input = '"Jörg" <joerg@münchen.de>';
  t.is(downgradeHeaderValue(input), '"Jörg" <joerg@xn--mnchen-3ya.de>');
});

test('header downgrade handles multiple recipients', (t) => {
  const input = 'user@müller.de, admin@münchen.de';
  t.is(
    downgradeHeaderValue(input),
    'user@xn--mller-kva.de, admin@xn--mnchen-3ya.de'
  );
});

test('header downgrade preserves ASCII-only headers', (t) => {
  const input = 'user@example.com, admin@test.org';
  t.is(downgradeHeaderValue(input), 'user@example.com, admin@test.org');
});

test('header downgrade handles group syntax', (t) => {
  const input = 'Team: user@münchen.de, admin@münchen.de;';
  t.is(
    downgradeHeaderValue(input),
    'Team: user@xn--mnchen-3ya.de, admin@xn--mnchen-3ya.de;'
  );
});

test('header downgrade handles angle bracket format', (t) => {
  const input = '<user@münchen.de>';
  t.is(downgradeHeaderValue(input), '<user@xn--mnchen-3ya.de>');
});
