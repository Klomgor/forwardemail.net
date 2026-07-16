/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

// eslint-disable-next-line import/no-unassigned-import
require('#helpers/polyfill-towellformed');
// eslint-disable-next-line import/no-unassigned-import
require('#config/env');

const process = require('node:process');
const { parentPort } = require('node:worker_threads');

// eslint-disable-next-line import/no-unassigned-import
require('#config/mongoose');

const Graceful = require('@ladjs/graceful');
const mongoose = require('mongoose');

const Aliases = require('#models/aliases');
const logger = require('#helpers/logger');
const setupMongoose = require('#helpers/setup-mongoose');

const graceful = new Graceful({
  mongooses: [mongoose],
  logger
});

graceful.listen();

(async () => {
  await setupMongoose(logger);

  try {
    //
    // Backfill: set welcome_email_sent_at for all existing aliases
    // that have IMAP enabled but haven't been marked yet.
    // This prevents duplicate welcome emails for aliases created
    // before this fix was deployed.
    //
    const result = await Aliases.updateMany(
      {
        has_imap: true,
        welcome_email_sent_at: { $exists: false }
      },
      {
        $set: { welcome_email_sent_at: new Date() }
      }
    );

    logger.info('Backfilled welcome_email_sent_at', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    await logger.error(err);
  }

  if (parentPort) parentPort.postMessage('done');
  else process.exit(0);
})();
