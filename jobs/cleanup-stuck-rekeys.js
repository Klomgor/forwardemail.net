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
const ms = require('ms');

const Aliases = require('#models/aliases');
const config = require('#config');
const email = require('#helpers/email');
const i18n = require('#helpers/i18n');
const logger = require('#helpers/logger');
const setupMongoose = require('#helpers/setup-mongoose');

const graceful = new Graceful({
  mongooses: [mongoose],
  logger
});

graceful.listen();

const REKEY_STALE_THRESHOLD = ms('15m');

(async () => {
  await setupMongoose(logger);

  try {
    const threshold = new Date(Date.now() - REKEY_STALE_THRESHOLD);

    // Find aliases stuck in rekey state
    const stuckAliases = await Aliases.find({
      is_rekey: true,
      $or: [
        { rekey_started_at: { $lt: threshold } },
        // Handle legacy aliases without rekey_started_at (pre-migration)
        { rekey_started_at: { $exists: false } }
      ]
    })
      .select('name domain user rekey_started_at')
      .populate('domain', 'name')
      .populate('user', 'email locale')
      .lean()
      .exec();

    if (stuckAliases.length === 0) {
      logger.info('No stuck rekey operations found');
    } else {
      logger.warn(`Found ${stuckAliases.length} stuck rekey operations`);

      for (const alias of stuckAliases) {
        try {
          await Aliases.findByIdAndUpdate(alias._id, {
            $set: { is_rekey: false },
            $unset: { rekey_started_at: 1 }
          });

          const ownerEmail = alias.user?.email;
          const locale = alias.user?.locale || i18n.config.defaultLocale;
          const domainName = alias.domain?.name || 'unknown';
          const username = `${alias.name}@${domainName}`;

          if (ownerEmail) {
            await email({
              template: 'alert',
              message: {
                to: ownerEmail,
                cc: config.alertsEmail,
                subject: i18n.translate(
                  'ALIAS_REKEY_INTERRUPTED_SUBJECT',
                  locale,
                  username
                )
              },
              locals: {
                message: i18n.translate(
                  'ALIAS_REKEY_INTERRUPTED',
                  locale,
                  username
                ),
                locale
              }
            });
          }

          logger.info('Cleared stuck rekey', {
            alias_id: alias._id,
            alias_name: username,
            rekey_started_at: alias.rekey_started_at
          });
        } catch (err) {
          logger.error('Failed to clear stuck rekey', {
            err,
            alias_id: alias._id
          });
        }
      }
    }
  } catch (err) {
    await logger.error(err);
  }

  if (parentPort) parentPort.postMessage('done');
  else process.exit(0);
})();
