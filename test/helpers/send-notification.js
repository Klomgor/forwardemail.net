const { setImmediate: setImmediatePromise } = require('node:timers/promises');

const test = require('ava');

const { decoder } = require('#helpers/encoder-decoder');
const sendNotification = require('#helpers/send-notification');
const sendPushNotification = require('#helpers/send-push-notification');

const { sendNotificationWithDependencies } = sendNotification._test;
const { PUSH_CONCURRENCY, fanOutToTokens } = sendPushNotification._test;

test('sendNotification starts BOTH push and WebSocket delivery with one immutable ID when zero sockets exist', async (t) => {
  let published;
  let pushCall;
  const neverSettles = new Promise(() => {});

  const client = {
    publishBuffer(channel, packed) {
      published = { channel, message: decoder.unpack(packed) };
      return neverSettles;
    }
  };

  const notificationId = sendNotificationWithDependencies({
    client,
    aliasId: 'alias-id',
    event: 'newMessage',
    data: {
      notificationId: 'caller-controlled-id',
      data: { mailbox: 'INBOX', message: { uid: 1 } }
    },
    pushNotificationSender(...args) {
      pushCall = args;
      return neverSettles;
    }
  });

  // No ApiWebSocketHandler or socket map exists in this test. Neither pending
  // transport may prevent the other from starting directly from sendNotification.
  await setImmediatePromise();
  t.truthy(pushCall);
  t.truthy(published);
  t.is(pushCall[0], client);
  t.is(pushCall[1], 'alias-id');
  t.is(pushCall[2], 'newMessage');
  t.is(pushCall[3].notificationId, notificationId);
  t.is(published.message.payload.notificationId, notificationId);
  t.not(notificationId, 'caller-controlled-id');
});

test('push fan-out attempts every active token with bounded parallelism', async (t) => {
  const tokenCount = PUSH_CONCURRENCY + 3;
  const tokens = Array.from({ length: tokenCount }, (_, index) => ({
    _id: `token-${index}`,
    platform: 'fcm'
  }));
  const started = [];
  const succeeded = [];
  const releases = [];
  let active = 0;
  let maxActive = 0;

  const fanOutPromise = fanOutToTokens(tokens, { title: 'New Email' }, null, {
    async deliverToToken(token) {
      started.push(token._id);
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => {
        releases.push(resolve);
      });
      active -= 1;
    },
    async recordSuccess(tokenId) {
      succeeded.push(tokenId);
    },
    async recordFailure() {
      t.fail('No token delivery should fail');
    },
    async deleteToken() {
      t.fail('No token should be deleted');
    }
  });

  await setImmediatePromise();
  t.is(started.length, PUSH_CONCURRENCY);
  t.is(maxActive, PUSH_CONCURRENCY);

  while (releases.length > 0) {
    releases.shift()();
    await setImmediatePromise();
  }

  await fanOutPromise;
  t.deepEqual(new Set(started), new Set(tokens.map((token) => token._id)));
  t.deepEqual(new Set(succeeded), new Set(tokens.map((token) => token._id)));
  t.is(started.length, tokenCount);
  t.is(succeeded.length, tokenCount);
  t.is(maxActive, PUSH_CONCURRENCY);
});
