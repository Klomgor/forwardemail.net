/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const process = require('node:process');

// eslint-disable-next-line import/no-unassigned-import
require('#helpers/polyfill-towellformed');
// eslint-disable-next-line import/no-unassigned-import
require('#config/env');
// eslint-disable-next-line import/no-unassigned-import
require('#config/mongoose');

const { setTimeout } = require('node:timers/promises');
const Graceful = require('@ladjs/graceful');
const Redis = require('@ladjs/redis');
const ip = require('ip');
const mongoose = require('mongoose');
const ms = require('ms');
const sharedConfig = require('@ladjs/shared-config');

const IMAP = require('./imap-server');

const createWebSocketAsPromised = require('#helpers/create-websocket-as-promised');
const logger = require('#helpers/logger');
const setupMongoose = require('#helpers/setup-mongoose');

const imapSharedConfig = sharedConfig('IMAP');
const client = new Redis(imapSharedConfig.redis, logger);
const subscriber = new Redis(imapSharedConfig.redis, logger);
client.setMaxListeners(0);
subscriber.setMaxListeners(0);

const wsp = createWebSocketAsPromised();

const imap = new IMAP({ client, subscriber, wsp });

const graceful = new Graceful({
  mongooses: [mongoose],
  servers: [imap.server],
  redisClients: [client, subscriber],
  logger,
  customHandlers: [
    //
    // Single sequential handler to enforce strict shutdown ordering.
    // @ladjs/graceful runs customHandlers in parallel via Promise.all(),
    // so we consolidate into one async function to guarantee:
    //   1. Wait for connection rate limiter / releaseConnection handlers
    //   2. Set isClosing to reject new IMAP commands
    //   3. Close the WebSocket to the SQLite server
    //
    async () => {
      // 1. Wait for connection rate limiter to finish
      //    (onClose and releaseConnection handlers run in background)
      await setTimeout(ms('3s'));

      // 2. Signal IMAP command handlers to reject new work
      imap.isClosing = true;

      // 3. Close WebSocket connection to SQLite server
      try {
        wsp.close();
      } catch (err) {
        logger.fatal(err);
      }
    }
  ]
});
graceful.listen();

(async () => {
  try {
    await imap.listen();
    if (process.send) process.send('ready');
    logger.info(
      `IMAP server listening on ${
        imap.server.address().port
      } (LAN: ${ip.address()}:${imap.server.address().port})`,
      { hide_meta: true }
    );
    await setupMongoose(logger);
  } catch (err) {
    // Use timeout to prevent hanging if MongoDB pool is exhausted
    await Promise.race([logger.error(err), setTimeout(5000)]);
    process.exit(1);
  }
})();

logger.info('IMAP server started', { hide_meta: true });
