/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const process = require('node:process');

const test = require('ava');
const sinon = require('sinon');

const { encoder } = require('#helpers/encoder-decoder');

test('wss.broadcast > is synchronous (non-blocking)', (t) => {
  // Simulate the broadcast function from sqlite-server.js
  const clients = new Set();
  const ws1 = { isAlive: true, send: sinon.stub() };
  const ws2 = { isAlive: true, send: sinon.stub() };
  const ws3 = { isAlive: false, send: sinon.stub() };
  clients.add(ws1);
  clients.add(ws2);
  clients.add(ws3);

  const publishStub = sinon.stub();
  const client = { publish: publishStub };
  const workerId = `${process.pid}:${Date.now()}`;

  // Replicate the broadcast logic (matches sqlite-server.js)
  function broadcast(session, payload) {
    const packed = encoder.pack({
      session_id: session.id,
      alias_id: session.user.alias_id,
      payload
    });
    for (const c of clients) {
      if (!c.isAlive) continue;
      try {
        c.send(packed);
      } catch {}
    }

    try {
      const envelope = encoder.pack({ workerId, data: packed });
      client.publish('wss_broadcast', envelope);
    } catch {}
  }

  const session = { id: 'sess-1', user: { alias_id: 'alias-1' } };
  const payload = { type: 'EXISTS', path: 'INBOX', value: 42 };

  // Should return immediately (no await, no promise)
  const result = broadcast(session, payload);
  t.is(result, undefined);

  // Should have sent to alive clients only
  t.true(ws1.send.calledOnce);
  t.true(ws2.send.calledOnce);
  t.false(ws3.send.called);

  // Should have published to Redis with envelope
  t.true(publishStub.calledOnce);
  t.is(publishStub.firstCall.args[0], 'wss_broadcast');
  // Verify envelope structure
  const envelope = encoder.unpack(publishStub.firstCall.args[1]);
  t.is(envelope.workerId, workerId);
  t.truthy(envelope.data);
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

  const publishStub = sinon.stub();
  const client = { publish: publishStub };
  const workerId = `${process.pid}:${Date.now()}`;

  function broadcast(session, payload) {
    const packed = encoder.pack({
      session_id: session.id,
      alias_id: session.user.alias_id,
      payload
    });
    for (const c of clients) {
      if (!c.isAlive) continue;
      try {
        c.send(packed);
      } catch {}
    }

    try {
      const envelope = encoder.pack({ workerId, data: packed });
      client.publish('wss_broadcast', envelope);
    } catch {}
  }

  const session = { id: 'sess-1', user: { alias_id: 'alias-1' } };
  // Should not throw even if one client errors
  t.notThrows(() => broadcast(session, { type: 'test' }));
  // ws2 should still receive the message
  t.true(ws2.send.calledOnce);
});

test('wss.broadcast > handles Redis publish throwing', (t) => {
  const clients = new Set();
  const ws1 = { isAlive: true, send: sinon.stub() };
  clients.add(ws1);

  const publishStub = sinon.stub().throws(new Error('Redis connection lost'));
  const client = { publish: publishStub };
  const workerId = `${process.pid}:${Date.now()}`;

  function broadcast(session, payload) {
    const packed = encoder.pack({
      session_id: session.id,
      alias_id: session.user.alias_id,
      payload
    });
    for (const c of clients) {
      if (!c.isAlive) continue;
      try {
        c.send(packed);
      } catch {}
    }

    try {
      const envelope = encoder.pack({ workerId, data: packed });
      client.publish('wss_broadcast', envelope);
    } catch {}
  }

  const session = { id: 'sess-1', user: { alias_id: 'alias-1' } };
  // Should not throw even if Redis errors
  t.notThrows(() => broadcast(session, { type: 'test' }));
  // Local client should still receive the message
  t.true(ws1.send.calledOnce);
});

test('wss.broadcast > packed message is decodable', (t) => {
  const clients = new Set();
  let sentData;
  const ws1 = {
    isAlive: true,
    send(data) {
      sentData = data;
    }
  };
  clients.add(ws1);

  const publishStub = sinon.stub();
  const client = { publish: publishStub };
  const workerId = `${process.pid}:${Date.now()}`;

  function broadcast(session, payload) {
    const packed = encoder.pack({
      session_id: session.id,
      alias_id: session.user.alias_id,
      payload
    });
    for (const c of clients) {
      if (!c.isAlive) continue;
      try {
        c.send(packed);
      } catch {}
    }

    try {
      const envelope = encoder.pack({ workerId, data: packed });
      client.publish('wss_broadcast', envelope);
    } catch {}
  }

  const session = { id: 'sess-123', user: { alias_id: 'alias-456' } };
  const payload = { type: 'EXISTS', path: 'INBOX', value: 99 };
  broadcast(session, payload);

  // Decode the sent message (local clients get the inner packed data directly)
  const decoded = encoder.unpack(sentData);
  t.is(decoded.session_id, 'sess-123');
  t.is(decoded.alias_id, 'alias-456');
  t.deepEqual(decoded.payload, payload);

  // Verify Redis envelope contains workerId for self-echo filtering
  const envelope = encoder.unpack(publishStub.firstCall.args[1]);
  t.is(envelope.workerId, workerId);
  // The inner data should decode to the same message
  const innerDecoded = encoder.unpack(envelope.data);
  t.is(innerDecoded.session_id, 'sess-123');
  t.is(innerDecoded.alias_id, 'alias-456');
  t.deepEqual(innerDecoded.payload, payload);
});
