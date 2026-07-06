/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */
const crypto = require('node:crypto');
const http2 = require('node:http2');
const { Buffer } = require('node:buffer');
const { setTimeout } = require('node:timers/promises');

const dayjs = require('dayjs-with-plugins');
const ms = require('ms');
const pMap = require('p-map');
const revHash = require('rev-hash');

const Aliases = require('#models/aliases');
const config = require('#config');
const getApnCerts = require('#helpers/get-apn-certs');
const logger = require('#helpers/logger');

//
// Unified Apple Push Notification helper for all three DAV-style services
// the project supports (Mail, Calendar, Contacts).  Historically this was
// three near-identical files (helpers/send-apn.js plus the now-removed
// helpers/send-apn-calendar.js and helpers/send-apn-contacts.js) which
// duplicated the provider lifecycle, the 410 unsubscribe path, the
// per-(account_id, device_token) rate-limit cache, and the topic-extraction
// logic.  All three now share this single file.
//
// Per-service differences captured in SERVICES:
//
//   * cert      -- key inside the `certs` bundle returned by getApnCerts
//   * subtopic  -- the alias.aps[].subtopic value to filter on
//   * cachePrefix -- Redis key prefix for the 1-minute send-coalescing lock
//   * errorLabel  -- label used in the "APS X failed" fatal error
//
// Exports:
//   * default    = sendApn (Mail variant with mailboxPath, used by IMAP)
//   * sendApnCalendar  -- CalDAV push entry-point
//   * sendApnContacts  -- CardDAV push entry-point
//   * sendApnForService -- low-level dispatcher used by the three above
//
// Call sites import the named exports directly via
// `const { sendApnCalendar } = require('#helpers/send-apn');` -- the old
// thin wrapper modules were intentionally deleted in v15 to avoid having
// two equivalent require paths for the same function.
//
//
// Per-service push semantics:
//
//   * cert        - key inside the `certs` bundle returned by getApnCerts
//   * subtopic    - the alias.aps[].subtopic value to filter on
//   * cachePrefix - Redis key prefix for the 1-minute send-coalescing lock
//   * errorLabel  - label used in the "APS X failed" fatal error
//   * pushType    - APNs `apns-push-type` header.  All three services use
//                   `background` to match the dovecot-xaps-daemon reference
//                   implementation.  These pushes are silent data-only signals
//                   that wake iOS system daemons (mobilemail, dataaccessd);
//                   the daemon then connects via IMAP/CalDAV/CardDAV to fetch
//                   new data and iOS itself generates any visible user-facing
//                   notification locally.
//                   <https://github.com/freswa/dovecot-xaps-daemon/blob/main/internal/apns.go>
//
const SERVICES = {
  Mail: {
    cert: 'Mail',
    subtopic: 'com.apple.mobilemail',
    cachePrefix: 'aps_check',
    errorLabel: 'APS failed',
    pushType: 'background'
  },
  Calendar: {
    cert: 'Calendar',
    subtopic: 'com.apple.mobilecal',
    cachePrefix: 'aps_calendar_check',
    errorLabel: 'APS Calendar failed',
    pushType: 'background'
  },
  Contact: {
    cert: 'Contact',
    subtopic: 'com.apple.mobileaddressbook',
    cachePrefix: 'aps_contacts_check',
    errorLabel: 'APS Contacts failed',
    pushType: 'background'
  }
};

let certs;
const providers = Object.create(null);

function ensureTopic(certBundle, certKey) {
  console.log(
    `[send-apn] ensureTopic: certKey=${certKey} existing topic=${
      certBundle[certKey].topic || '(none)'
    }`
  );
  if (certBundle[certKey].topic) return certBundle[certKey].topic;
  const cert = new crypto.X509Certificate(certBundle[certKey].certificate);
  const parsedCert = new (require('@peculiar/x509').X509Certificate)(
    certBundle[certKey].certificate
  );
  const extension = parsedCert.extensions.find(
    (e) => e.type === '1.2.840.113635.100.6.3.6'
  );
  if (extension) {
    const value = Buffer.from(extension.value).toString('utf8');
    const match = value.match(/com\.apple\.[a-zA-Z\d.-]+/);
    if (match) {
      certBundle[certKey].topic = match[0];
      console.log(
        `[send-apn] ensureTopic: resolved from OID extension: ${match[0]}`
      );
      return match[0];
    }
  }

  const lines = cert.subject.split('\n');
  const uidLine = lines.find((l) => l.includes('UID='));
  if (uidLine) {
    certBundle[certKey].topic = uidLine.split('UID=')[1].trim();
    console.log(
      `[send-apn] ensureTopic: resolved from Subject UID: ${certBundle[certKey].topic}`
    );
    return certBundle[certKey].topic;
  }

  throw new Error(`Could not determine APNs topic for ${certKey}`);
}

//
// Pure Node.js HTTP/2 APNs Client
// Replaces @parse/node-apn to fix missing Content-Type headers and connection
// lifecycle issues.
//
// Key differences from @parse/node-apn:
//   1. Explicitly sets `content-type: application/json; charset=utf-8` on every
//      request -- node-apn never set this header, which caused APNs to silently
//      drop payloads even while returning HTTP 200.
//      <https://github.com/sideshow/apns2/blob/master/client.go#L214>
//   2. Connection lifecycle managed via native http2 session events (close /
//      error / goaway) instead of the fragile isProviderAlive() property check.
//   3. No third-party dependency -- uses Node's built-in node:http2 module.
//
class ApnsClient {
  constructor(cert, key, serviceName) {
    this.cert = cert;
    this.key = key;
    this.serviceName = serviceName;
    //
    // Always use the production endpoint.  The XAPPLEPUSHSERVICE certificates
    // are provisioned against production APNs only; the sandbox endpoint will
    // reject them with a 403 InvalidProviderToken.
    //
    this.host = 'api.push.apple.com';
    this.client = null;
    this.connectPromise = null;
    console.log(
      `[send-apn] ApnsClient constructed: service=${serviceName} host=${this.host}`
    );
  }

  async connect() {
    if (this.client && !this.client.closed && !this.client.destroyed) {
      console.log(
        `[send-apn] ApnsClient.connect: reusing existing HTTP/2 session (service=${this.serviceName})`
      );
      return this.client;
    }

    if (this.connectPromise) {
      console.log(
        `[send-apn] ApnsClient.connect: connection already in progress, awaiting (service=${this.serviceName})`
      );
      return this.connectPromise;
    }

    console.log(
      `[send-apn] ApnsClient.connect: opening new HTTP/2 session to ${this.host} (service=${this.serviceName})`
    );

    this.connectPromise = new Promise((resolve, reject) => {
      const client = http2.connect(`https://${this.host}`, {
        cert: this.cert,
        key: this.key,
        ALPNProtocols: ['h2'],
        rejectUnauthorized: true
      });

      client.on('connect', () => {
        console.log(
          `[send-apn] ApnsClient: HTTP/2 session connected to ${this.host} (service=${this.serviceName})`
        );
        this.client = client;
        this.connectPromise = null;
        resolve(client);
      });

      client.on('error', (err) => {
        console.error(
          `[send-apn] ApnsClient: HTTP/2 session error (service=${this.serviceName}): ${err.message}`
        );
        logger.error(`APNs HTTP/2 connection error: ${err.message}`);
        this.client = null;
        this.connectPromise = null;
        reject(err);
      });

      client.on('close', () => {
        console.log(
          `[send-apn] ApnsClient: HTTP/2 session closed (service=${this.serviceName})`
        );
        this.client = null;
        this.connectPromise = null;
      });

      client.on('goaway', (errorCode, lastStreamId, opaqueData) => {
        console.warn(
          `[send-apn] ApnsClient: GOAWAY received (service=${this.serviceName}) errorCode=${errorCode} lastStreamId=${lastStreamId} opaqueData=${opaqueData}`
        );
        this.client = null;
        this.connectPromise = null;
      });
    });

    return this.connectPromise;
  }

  async send(note, deviceToken) {
    console.log(
      `[send-apn] ApnsClient.send: service=${
        this.serviceName
      } device=${deviceToken} topic=${note.topic} pushType=${
        note.pushType
      } priority=${
        note.priority === undefined ? '(omitted)' : note.priority
      } expiry=${note.expiry}`
    );
    console.log(
      `[send-apn] ApnsClient.send: payload=${JSON.stringify(note.payload)}`
    );

    const client = await this.connect();

    return new Promise((resolve) => {
      const headers = {
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        'content-type': 'application/json; charset=utf-8',
        'apns-topic': note.topic,
        'apns-push-type': note.pushType,
        'apns-expiration': note.expiry
      };

      if (note.priority !== undefined) {
        headers['apns-priority'] = note.priority;
      }

      console.log(
        `[send-apn] ApnsClient.send: HTTP/2 request headers=${JSON.stringify(
          headers
        )}`
      );

      const req = client.request(headers);

      req.setEncoding('utf8');

      let status;
      req.on('response', (resHeaders) => {
        status = resHeaders[':status'];
        console.log(
          `[send-apn] ApnsClient.send: HTTP/2 response status=${status} apns-id=${
            resHeaders['apns-id'] || '(none)'
          } (device=${deviceToken})`
        );
      });

      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        console.log(
          `[send-apn] ApnsClient.send: response ended status=${status} body=${
            data || '(empty)'
          } (device=${deviceToken})`
        );
        if (status === 200) {
          console.log(
            `[send-apn] ApnsClient.send: SUCCESS device=${deviceToken}`
          );
          resolve({ sent: [{ device: deviceToken }], failed: [] });
        } else {
          let reason = 'UnknownError';
          try {
            if (data) reason = JSON.parse(data).reason;
          } catch (err) {
            console.error(
              `[send-apn] ApnsClient.send: failed to parse error body: ${err.message}`
            );
          }

          console.error(
            `[send-apn] ApnsClient.send: FAILED device=${deviceToken} status=${status} reason=${reason}`
          );
          resolve({
            sent: [],
            failed: [{ device: deviceToken, status, response: { reason } }]
          });
        }
      });

      req.on('error', (err) => {
        console.error(
          `[send-apn] ApnsClient.send: request error device=${deviceToken}: ${err.message}`
        );
        resolve({
          sent: [],
          failed: [
            {
              device: deviceToken,
              status: 500,
              response: { reason: err.message }
            }
          ]
        });
      });

      const body = JSON.stringify(note.payload);
      console.log(
        `[send-apn] ApnsClient.send: writing body (${Buffer.byteLength(
          body
        )} bytes): ${body}`
      );
      req.write(body);
      req.end();
    });
  }
}

function createNote(certBundle, service, obj, options) {
  console.log(
    `[send-apn] createNote: service=${service.cert} device=${
      obj.device_token
    } account_id=${obj.account_id || '(none)'} key=${
      obj.key || '(none)'
    } mailboxPath=${options.mailboxPath || '(none)'}`
  );

  const note = {
    topic: certBundle[service.cert].topic,
    pushType: service.pushType,
    expiry: Math.floor(dayjs().add(24, 'hour').toDate().getTime() / 1000),
    payload: {}
  };

  if (service.cert === 'Mail') {
    //
    // Mail: explicitly set priority 5 for background pushes.
    // Apple APNs documentation states: "For the background push type, always
    // use priority 5. Using priority 10 is an error."
    // Omitting the header causes APNs to default to priority 10 internally,
    // which results in iOS power management aggressively throttling or silently
    // dropping the push on the device side even though APNs returns HTTP 200.
    //
    note.priority = 5;

    const aps = {};
    if (obj.account_id) aps['account-id'] = obj.account_id;
    // aps.m carries an array of md5(mailboxPath) hashes that tell iOS Mail
    // which specific mailbox changed, avoiding a full-account sync.  Commented
    // out while debugging iOS wakeup -- the minimal payload is just account-id.
    // Re-enable once basic wakeup is confirmed working.
    // aps.m = [
    //   crypto
    //     .createHash('md5')
    //     .update(options.mailboxPath || 'INBOX')
    //     .digest('hex')
    // ];
    note.payload.aps = aps;
    console.log(
      `[send-apn] createNote: Mail aps=${JSON.stringify(
        aps
      )} (aps.m commented out for debugging)`
    );
  } else {
    //
    // Calendar / Contact: priority 5 (background batched delivery is fine).
    // Payload matches Apple's ccs-calendarserver reference implementation:
    //   { key, dataChangedTimestamp, pushRequestSubmittedTimestamp }
    // No `aps` dictionary -- node-apn's apsPayload() returns undefined when
    // all aps keys are undefined, so JSON.stringify omits the key entirely.
    //
    note.priority = 5;

    const now = Math.floor(Date.now() / 1000);
    note.payload = {
      key: obj.key || '',
      dataChangedTimestamp: now,
      pushRequestSubmittedTimestamp: now
    };
    console.log(
      `[send-apn] createNote: ${service.cert} payload=${JSON.stringify(
        note.payload
      )}`
    );
  }

  console.log(
    `[send-apn] createNote: topic=${note.topic} pushType=${
      note.pushType
    } priority=${
      note.priority === undefined ? '(omitted)' : note.priority
    } expiry=${note.expiry}`
  );
  return note;
}

//
// Pre-filter alias.aps[] entries to one row per (device, target) pair so
// duplicate or near-duplicate rows do not produce duplicate APNs sends.
// Exposed via `sendApn._test.dedupeRegistrations` for unit testing.  See
// the call site for the full motivation; the dedupe key is:
//
//   * Mail               -> lowercase(device_token) + '|' + mailboxPath
//   * Calendar / Contact -> lowercase(device_token) + '|' + (key || '')
//
// The first row encountered for each dedupe key wins so the original
// device_token casing is preserved for the 410-Gone unsubscribe path.
//
function dedupeRegistrations(matched, service, options = {}) {
  const mailboxPathForKey =
    service.cert === 'Mail' ? options.mailboxPath || 'INBOX' : null;

  const seen = new Map();

  for (const row of matched) {
    if (!row || !row.device_token) continue;
    const tokenLc = row.device_token.toLowerCase();
    const dedupeKey =
      service.cert === 'Mail'
        ? `${tokenLc}|${mailboxPathForKey}`
        : `${tokenLc}|${row.key || ''}`;

    if (seen.has(dedupeKey)) {
      console.log(
        `[send-apn] dedupeRegistrations: dropping duplicate registration dedupeKey=${dedupeKey} device=${row.device_token}`
      );
    } else {
      seen.set(dedupeKey, row);
    }
  }

  return [...seen.values()];
}

async function sendApnForService(serviceName, client, id, options = {}) {
  console.log(
    `[send-apn] sendApnForService: START service=${serviceName} alias_id=${id} options=${JSON.stringify(
      options
    )}`
  );

  const service = SERVICES[serviceName];
  if (!service) throw new TypeError(`Unsupported APN service: ${serviceName}`);

  const alias = await Aliases.findOne({ id }).lean().select('+aps').exec();
  if (!alias) {
    console.log(
      `[send-apn] sendApnForService: alias not found for id=${id}, skipping`
    );
    return;
  }

  if (!Array.isArray(alias.aps) || alias.aps.length === 0) {
    console.log(
      `[send-apn] sendApnForService: alias id=${id} has no aps[] registrations, skipping`
    );
    return;
  }

  console.log(
    `[send-apn] sendApnForService: alias id=${id} has ${alias.aps.length} total aps[] entries`
  );

  //
  // Filter to the registrations that belong to this service.
  //
  // alias.aps[] may contain a mix of Mail (com.apple.mobilemail), Calendar
  // (com.apple.mobilecal) and Contacts (com.apple.mobileaddressbook)
  // entries.  Sending a Calendar push (topic = certs.Calendar.topic,
  // aps.account-id = <Mail account UUID>) to a Mail device token is
  // silently dropped by iOS dataaccessd because the topic + account-id
  // pair does not match any account on the device.  Without this filter
  // the pushes appear to be sent but never reach the user.
  //
  // For Mail we accept either an explicit subtopic match OR no subtopic
  // (legacy registrations from before subtopic enforcement -- those were
  // all Mail registrations, since Calendar/Contacts push registration
  // post-dates the subtopic field).
  //
  const matched = alias.aps.filter((a) =>
    service.cert === 'Mail'
      ? !a.subtopic || a.subtopic === service.subtopic
      : a.subtopic === service.subtopic
  );

  console.log(
    `[send-apn] sendApnForService: ${matched.length}/${alias.aps.length} entries match subtopic=${service.subtopic} (service=${serviceName})`
  );

  if (matched.length === 0) {
    console.log(
      `[send-apn] sendApnForService: no matching registrations for service=${serviceName}, skipping`
    );
    return;
  }

  //
  // In-memory uniqueness pre-filter.
  //
  // alias.aps[] can accumulate duplicate or near-duplicate rows over time.
  // The two real-world causes we have observed in production:
  //
  //  1. iOS Mail rotates `account_id` on backup-and-restore, account
  //     remove/re-add, or OS-upgrade migration -- but `device_token` is
  //     stable.  The on-xapplepushservice upsert key is
  //     (device_token, account_id), so each rotation appends a new row
  //     instead of replacing the old one.  We have observed 15+ stale
  //     rows for a single physical device on one alias.
  //
  //  2. APNs treats device_token as case-insensitive hex, but iOS
  //     XAPPLEPUSHSERVICE registrations historically use UPPERCASE while
  //     CalDAV / CardDAV /apns POSTs use lowercase.  Two rows differing
  //     only in token case still address the SAME physical device.
  //
  // Without dedupe each duplicate row would produce a separate APNs send
  // with an identical wire body, wasting writes (and risking APNs
  // throttling) without delivering any additional information to iOS
  // (the device only refreshes the affected mailbox / collection once
  // regardless of how many duplicate pushes it receives).
  //
  // Dedupe key per service:
  //   * Mail               -- lowercase(device_token) + '|' + mailboxPath
  //                           (one push per (device, mailbox); identical
  //                            (token, mailbox) regardless of account_id
  //                            produces an identical Mail push payload
  //                            because aps.m = [md5(mailboxPath)])
  //   * Calendar / Contact -- lowercase(device_token) + '|' + (key || '')
  //                           (one push per (device, collection); the wire
  //                            body's `key` is opaque and identifies the
  //                            collection that changed)
  //
  // We keep the FIRST row for each dedupe key so the original
  // device_token casing is preserved for the 410-Gone unsubscribe path,
  // which strict-equals on (device_token, key) when removing rows.
  //
  const registrations = dedupeRegistrations(matched, service, options);

  if (matched.length !== registrations.length) {
    console.log(
      `[send-apn] sendApnForService: deduped ${matched.length} -> ${registrations.length} registrations (service=${serviceName} alias_id=${id})`
    );
    logger.debug('sendApnForService deduped registrations', {
      service: serviceName,
      alias_id: id,
      before: matched.length,
      after: registrations.length
    });
  }

  //
  // Long-lived cached provider (one per service).  We never call
  // `provider.shutdown(fn)` because we keep the HTTP/2 connection alive.
  //
  if (providers[serviceName]) {
    console.log(
      `[send-apn] sendApnForService: reusing cached ApnsClient for service=${serviceName}`
    );
  } else {
    console.log(
      `[send-apn] sendApnForService: no cached provider for service=${serviceName}, fetching certs and creating ApnsClient`
    );
    certs = await getApnCerts(client);
    ensureTopic(certs, service.cert);
    console.log(
      `[send-apn] sendApnForService: cert topic for ${service.cert}=${
        certs[service.cert].topic
      }`
    );

    providers[serviceName] = new ApnsClient(
      certs[service.cert].certificate,
      certs[service.cert].privateKey,
      serviceName
    );
  }

  const provider = providers[serviceName];

  await pMap(registrations, async (obj) => {
    try {
      //
      // Coalesce sends to the same registration to one per minute -- avoids
      // piling up requests during a sync storm.  We key on (device_token,
      // collection-key) because account_id is OPTIONAL for CalDAV/CardDAV
      // (iOS never sends it in the registration POST); using account_id
      // here would collapse all subscriptions for the alias into a single
      // shared lock and only one push per minute would be delivered to the
      // alias regardless of which collection changed.
      //
      const cacheTokens = [
        service.cachePrefix,
        revHash(obj.device_token || ''),
        revHash(obj.key || obj.account_id || '')
      ];
      const key = cacheTokens.join(':');

      console.log(
        `[send-apn] sendApnForService: checking coalesce cache key=${key} device=${obj.device_token}`
      );
      const cache = await client.get(key);

      if (cache) {
        console.log(
          `[send-apn] sendApnForService: coalesce cache HIT, skipping push for device=${obj.device_token} (service=${serviceName})`
        );
        return;
      }

      console.log(
        `[send-apn] sendApnForService: coalesce cache MISS, setting lock and waiting 10s before push (device=${obj.device_token})`
      );
      await client.set(key, true, 'PX', ms('1m'));

      // Artificial 10s delay so multiple back-to-back mutations coalesce
      // into a single push (matches the pre-unification behaviour).
      await setTimeout(ms('10s'));

      const note = createNote(certs, service, obj, options);

      // note they have commented out code at this below link for setting priority in note
      // <https://github.com/freswa/dovecot-xaps-daemon/blob/abce2f14cf1b5afa56329ebb4d923c9c2aebdfe3/internal/apns.go#L162-L163>
      logger.debug('sendApnForService dispatching', {
        service: serviceName,
        topic: note.topic,
        device_token: obj.device_token,
        key: obj.key,
        subtopic: obj.subtopic,
        priority: note.priority === undefined ? '(omitted)' : note.priority,
        push_type: note.pushType
      });

      const result = await provider.send(note, obj.device_token);

      console.log(
        `[send-apn] sendApnForService: send result service=${serviceName} device=${
          obj.device_token
        } sent=${Array.isArray(result.sent) ? result.sent.length : 0} failed=${
          Array.isArray(result.failed) ? result.failed.length : 0
        }`
      );

      logger.debug('sendApnForService result', {
        service: serviceName,
        sent: Array.isArray(result.sent) ? result.sent.length : 0,
        failed: Array.isArray(result.failed) ? result.failed.length : 0,
        result
      });

      // NOTE: if device returns 410 then unsubscribe on our side too
      // If the device returns 410 we unsubscribe on our side too.
      if (Array.isArray(result.failed) && result.failed.length > 0) {
        console.warn(
          `[send-apn] sendApnForService: ${result.failed.length} failed push(es) for service=${serviceName}:`,
          JSON.stringify(result.failed)
        );

        //
        // Handle 429 TooManyRequests -- APNs rate limit, not a bug.
        // The device will receive the next successful push and sync then.
        // Extend the coalescing lock to 5 minutes for this device to
        // back off and avoid hitting the rate limit again immediately.
        //
        const rateLimited = result.failed.filter(
          (r) => Number.parseInt(r.status, 10) === 429
        );

        if (rateLimited.length > 0) {
          console.warn(
            `[send-apn] sendApnForService: APNs rate limited (429) for device=${obj.device_token}, extending backoff to 5m`
          );
          logger.warn('APNs rate limited (429 TooManyRequests)', {
            service: serviceName,
            device: obj.device_token,
            count: rateLimited.length
          });
          await client.set(key, true, 'PX', ms('5m'));
          return;
        }

        const unregisteredDeviceTokens = result.failed
          .filter((r) => Number.parseInt(r.status, 10) === 410)
          .map((r) => r.device);

        if (unregisteredDeviceTokens.length === 0) {
          console.error(
            `[send-apn] sendApnForService: unexpected failure (not 410/429) for service=${serviceName}:`,
            JSON.stringify(result.failed)
          );
          const err = new TypeError(service.errorLabel);
          err.isCodeBug = true;
          err.result = result;
          logger.fatal(err);
          return;
        }

        console.log(
          `[send-apn] sendApnForService: device token(s) returned 410 Gone (unregistered): ${unregisteredDeviceTokens.join(
            ', '
          )}, removing from alias`
        );

        if (
          unregisteredDeviceTokens.length === 1 &&
          unregisteredDeviceTokens[0] === obj.device_token
        ) {
          const aliases = await Aliases.find({
            // We are unsure of the likelihood of Apple issuing two identical
            // device tokens; the pair-match filter below is the safeguard.
            'aps.device_token': obj.device_token
          })
            .select('+aps')
            .lean()
            .exec();

          console.log(
            `[send-apn] sendApnForService: found ${aliases.length} alias(es) with device_token=${obj.device_token} to clean up`
          );

          await pMap(
            aliases,
            async (alias) => {
              //
              // Remove the (device_token, key) pair that returned 410.
              // Match strictly on the pair: a single physical device may
              // hold multiple subscriptions on this alias (one per
              // calendar/addressbook), so we must not unsubscribe siblings
              // that share the device_token but identify a different
              // collection.  account_id is optional and not always present.
              //
              const before = alias.aps.length;
              const filtered = alias.aps.filter(
                (a) =>
                  !(a.device_token === obj.device_token && a.key === obj.key)
              );
              console.log(
                `[send-apn] sendApnForService: unsubscribing alias._id=${alias._id} aps ${before} -> ${filtered.length} entries`
              );
              await Aliases.findByIdAndUpdate(alias._id, {
                $set: { aps: filtered }
              });
            },
            { concurrency: config.concurrency }
          );
        } else {
          throw new TypeError(
            `Device token mismatch ${
              obj.device_token
            } vs. ${unregisteredDeviceTokens.join(', ')}`
          );
        }
      }
    } catch (err) {
      console.error(
        `[send-apn] sendApnForService: caught error for device=${obj.device_token} service=${serviceName}:`,
        err
      );
      logger.fatal(err, { obj });
    }
  });

  console.log(
    `[send-apn] sendApnForService: DONE service=${serviceName} alias_id=${id}`
  );
}

// Backward-compatible default export: Mail push with optional mailboxPath.
async function sendApn(client, id, mailboxPath = 'INBOX') {
  console.log(
    `[send-apn] sendApn (Mail): alias_id=${id} mailboxPath=${mailboxPath}`
  );
  return sendApnForService('Mail', client, id, { mailboxPath });
}

async function sendApnCalendar(client, id) {
  console.log(`[send-apn] sendApnCalendar: alias_id=${id}`);
  return sendApnForService('Calendar', client, id);
}

async function sendApnContacts(client, id) {
  console.log(`[send-apn] sendApnContacts: alias_id=${id}`);
  return sendApnForService('Contact', client, id);
}

// Default export remains `sendApn` (Mail) for full backward compatibility
// with `require('#helpers/send-apn')` call sites.  Named helpers are
// attached to the function for code that wants to switch on service.
//
// `createNote` and `SERVICES` are exported as test-only surface so unit
// tests can verify the per-service pushType, the conditional account-id
// payload, and the SERVICES table without mounting an APN provider.
sendApn.sendApn = sendApn;
sendApn.sendApnCalendar = sendApnCalendar;
sendApn.sendApnContacts = sendApnContacts;
sendApn.sendApnForService = sendApnForService;
sendApn._test = { createNote, dedupeRegistrations, SERVICES };

module.exports = sendApn;
