/* istanbul ignore file */

/*
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * This file incorporates work covered by the following copyright and
 * permission notice:
 *
 *   WildDuck Mail Agent is licensed under the European Union Public License 1.2 or later.
 *   https://github.com/nodemailer/wildduck
 */

const bytes = require('@forwardemail/bytes');

const Aliases = require('#models/aliases');
const i18n = require('#helpers/i18n');
const refineAndLogError = require('#helpers/refine-and-log-error');
const {
  sendAlert,
  getConnectionForSession,
  ALERT_TTL
} = require('#helpers/imap/send-imap-alert');

async function onGetQuota(path, session, fn) {
  this.logger.debug('GETQUOTA', { path, session });

  try {
    await this.refreshSession(session, 'GETQUOTA');

    if (path !== '') return fn(null, 'NONEXISTENT');

    const { storageUsed, maxQuotaPerAlias } = await Aliases.isOverQuota(
      {
        id: session.user.alias_id,
        domain: session.user.domain_id,
        locale: session.user.locale
      },
      0,
      this.client
    );

    //
    // IMAP ALERT: Send quota warning when usage is high.
    // This is triggered when the client explicitly checks quota (e.g. GETQUOTA "").
    // Rate-limited via Redis NX (set-if-not-exists) to avoid repeated alerts.
    //
    if (maxQuotaPerAlias > 0) {
      const usagePercent = storageUsed / maxQuotaPerAlias;
      const aliasId = session.user.alias_id;
      const locale = session.user.locale || i18n.config.defaultLocale;

      if (usagePercent >= 0.8) {
        const isCritical = usagePercent >= 0.95;
        const key = isCritical
          ? `imap_alert:quota_critical:${aliasId}`
          : `imap_alert:quota_warning:${aliasId}`;
        const ttl = isCritical
          ? ALERT_TTL.quota_critical
          : ALERT_TTL.quota_warning;
        const phrase = isCritical
          ? 'IMAP_ALERT_QUOTA_CRITICAL'
          : 'IMAP_ALERT_QUOTA_WARNING';

        this.client
          .set(key, '1', 'PX', ttl, 'NX')
          .then((locked) => {
            if (!locked) return;
            const connection = getConnectionForSession(this.server, session);
            if (!connection) return;
            sendAlert(
              connection,
              i18n.translate(
                phrase,
                locale,
                Math.round(usagePercent * 100),
                bytes(storageUsed),
                bytes(maxQuotaPerAlias)
              )
            );
          })
          .catch((err) => this.logger.debug('IMAP ALERT quota error', { err }));
      }
    }

    fn(null, {
      root: '',
      quota: maxQuotaPerAlias,
      storageUsed
    });
  } catch (err) {
    const error = refineAndLogError(err, session, true, this);
    if (error.imapResponse) return fn(null, error.imapResponse);
    fn(error);
  }
}

module.exports = onGetQuota;
