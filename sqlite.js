/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

// eslint-disable-next-line import/no-unassigned-import
require('#helpers/polyfill-towellformed');
// eslint-disable-next-line import/no-unassigned-import
require('#config/env');
// eslint-disable-next-line import/no-unassigned-import
require('#config/mongoose');

const process = require('node:process');
const { promisify } = require('node:util');
const { setTimeout } = require('node:timers/promises');

const Graceful = require('@ladjs/graceful');
const Redis = require('@ladjs/redis');
const ip = require('ip');
const mongoose = require('mongoose');
const ms = require('ms');
const sharedConfig = require('@ladjs/shared-config');

const SQLite = require('./sqlite-server');

const closeDatabase = require('#helpers/close-database');
const logger = require('#helpers/logger');
const setupMongoose = require('#helpers/setup-mongoose');

const imapSharedConfig = sharedConfig('IMAP');
const client = new Redis(imapSharedConfig.redis, logger);
const subscriber = new Redis(imapSharedConfig.redis, logger);
client.setMaxListeners(0);
subscriber.setMaxListeners(0);

const sqlite = new SQLite({ client, subscriber });

const graceful = new Graceful({
  mongooses: [mongoose],
  servers: [sqlite.server],
  redisClients: [client, subscriber],
  logger,
  timeoutMs: ms('1m'),
  customHandlers: [
    //
    // Single sequential handler to enforce strict shutdown ordering.
    // @ladjs/graceful runs customHandlers in parallel via Promise.all(),
    // so we must consolidate into one async function to guarantee:
    //   1. Stop accepting new work (isClosing)
    //   2. Wait for in-flight requests to drain (refcount polling)
    //   3. Close WebSocket server (no new connections)
    //   4. Close all database handles (safe after drain)
    //
    async () => {
      // 1. Signal all request handlers to reject new work
      sqlite.isClosing = true;

      // 2. Wait for in-flight requests to complete (poll refcounts)
      //    parsePayload checks isClosing and will reject new work,
      //    so only existing requests need to finish.
      const drainStart = Date.now();
      const drainTimeout = ms('30s');
      if (sqlite.databaseMap && sqlite.databaseMap.size > 0) {
        while (Date.now() - drainStart < drainTimeout) {
          let activeRefs = 0;
          for (const key of sqlite.databaseMap.keys()) {
            const entry = sqlite.databaseMap._map.get(key);
            if (entry && entry.refcount > 0) activeRefs += entry.refcount;
          }

          if (activeRefs === 0) break;
          await setTimeout(250);
        }
      }

      // 3. Close the WebSocket server (stops accepting new connections,
      //    terminates existing ones after in-flight work has drained)
      try {
        await promisify(sqlite.wss.close).bind(sqlite.wss)();
      } catch (err) {
        logger.error(err);
      }

      // 4. Close all normal databases
      if (sqlite.databaseMap && sqlite.databaseMap.size > 0) {
        await Promise.allSettled(
          [...sqlite.databaseMap.keys()].map(async (key) => {
            const db = sqlite.databaseMap.get(key);
            if (db) {
              sqlite.databaseMap.evict(key);
              await closeDatabase(db);
            }
          })
        );
      }

      // 5. Close all temporary databases
      if (sqlite.temporaryDatabaseMap && sqlite.temporaryDatabaseMap.size > 0) {
        await sqlite.temporaryDatabaseMap.closeAll();
      }
    }
  ]
});
graceful.listen();

(async () => {
  try {
    await sqlite.listen();
    if (process.send) process.send('ready');
    const { port } = sqlite.server.address();
    logger.info(
      `SQLite WebSocket server listening on ${port} (LAN: ${ip.address()}:${port})`,
      { hide_meta: true }
    );
    await setupMongoose(logger);
  } catch (err) {
    // Use timeout to prevent hanging if MongoDB pool is exhausted
    await Promise.race([logger.error(err), setTimeout(5000)]);
    process.exit(1);
  }
})();
