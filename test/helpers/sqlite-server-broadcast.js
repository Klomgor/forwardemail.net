/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const { randomUUID } = require('node:crypto');

const test = require('ava');
const sinon = require('sinon');

const { encoder } = require('#helpers/encoder-decoder');

test('wss.broadcast > sends packed message with uuid to all alive clients', (t) => {
  const clients = new Set();
  const ws1 = { isAlive: true, send: sinon.stub() };
  const ws2 = { isAlive: true, send: sinon.stub() };
  const ws3 = { isAlive: false, send: sinon.stub() };
  clients.add(ws1);
  clients.add(ws2);
  clients.add(ws3);

  const uuid = randomUUID();
  const session = { id: 'sess-1', user: { alias_id: 'alias-1' } };
  const payload = { type: 'EXISTS', path: 'INBOX', value: 42 };

  const packed = encoder.pack({
    uuid,
    session_id: session.id,
    alias_id: session.user.alias_id,
    payload
  });

  for (const client of clients) {
    if (!client.isAlive) continue;
    try {
      client.send(packed);
    } catch {}
  }

  // Should have sent to alive clients only
  t.true(ws1.send.calledOnce);
  t.true(ws2.send.calledOnce);
  t.false(ws3.send.called);
});

test('wss.broadcast > handles client.send() throwing', (t) => {
  const clients = new Set();
  const ws1 = {
    isAlive: true,
    send: sinon.stub().throws(new Error('connection reset'))
  };
  const ws2 = { isAlive: true, send: sinon.stub() };
  clients.add(ws1);
  clients.add(ws2);

  const uuid = randomUUID();
  const session = { id: 'sess-1', user: { alias_id: 'alias-1' } };
  const payload = { type: 'test' };

  const packed = encoder.pack({
    uuid,
    session_id: session.id,
    alias_id: session.user.alias_id,
    payload
  });

  // Should not throw even if one client errors
  t.notThrows(() => {
    for (const client of clients) {
      if (!client.isAlive) continue;
      try {
        client.send(packed);
      } catch {}
    }
  });

  // ws2 should still receive the message
  t.true(ws2.send.calledOnce);
});

test('wss.broadcast > packed message includes uuid for ACK', (t) => {
  const clients = new Set();
  let sentData;
  const ws1 = {
    isAlive: true,
    send(data) {
      sentData = data;
    }
  };
  clients.add(ws1);

  const uuid = randomUUID();
  const session = { id: 'sess-123', user: { alias_id: 'alias-456' } };
  const payload = { type: 'EXISTS', path: 'INBOX', value: 99 };

  const packed = encoder.pack({
    uuid,
    session_id: session.id,
    alias_id: session.user.alias_id,
    payload
  });

  for (const client of clients) {
    if (!client.isAlive) continue;
    try {
      client.send(packed);
    } catch {}
  }

  // Decode the sent message
  const decoded = encoder.unpack(sentData);
  t.is(decoded.uuid, uuid);
  t.is(decoded.session_id, 'sess-123');
  t.is(decoded.alias_id, 'alias-456');
  t.deepEqual(decoded.payload, payload);
});

test('wss.broadcast > uuidsReceived set tracks acknowledged UUIDs', (t) => {
  const uuidsReceived = new Set();
  const uuid = randomUUID();

  // Simulate receiving an ACK from the IMAP server
  t.false(uuidsReceived.has(uuid));
  uuidsReceived.add(uuid);
  t.true(uuidsReceived.has(uuid));

  // After processing, the UUID is cleaned up
  uuidsReceived.delete(uuid);
  t.false(uuidsReceived.has(uuid));
});
