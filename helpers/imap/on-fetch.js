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

const getStream = require('get-stream');
const tools = require('@zone-eu/wildduck/lib/tools');
const { Builder } = require('json-sql-enhanced');
const {
  IMAPConnection
} = require('@zone-eu/wildduck/imap-core/lib/imap-connection');
const { imapHandler } = require('@zone-eu/wildduck/imap-core');
const IMAPError = require('#helpers/imap-error');
const Mailboxes = require('#models/mailboxes');
const Messages = require('#models/messages');
const getQueryResponse = require('#helpers/get-query-response');
const i18n = require('#helpers/i18n');
const refineAndLogError = require('#helpers/refine-and-log-error');
const sendNotification = require('#helpers/send-notification');
const compileImapResponse = require('#helpers/imap/compile-imap-response');
const {
  prepareQuery,
  syncConvertResult
} = require('#helpers/mongoose-to-sqlite');

// const LIMITED_PROJECTION_KEYS = new Set(['_id', 'flags', 'modseq', 'uid']);
// const MAX_BULK_WRITE_SIZE = 1000;

const builder = new Builder({ bufferAsNative: true });

const { formatResponse } = IMAPConnection.prototype;

async function onFetch(mailboxId, options, session, fn) {
  this.logger.debug('FETCH', { mailboxId, options, session });

  if (this.wsp) {
    try {
      const [bool, response, compiledPayloads, entries] =
        await this.wsp.request({
          action: 'fetch',
          session: {
            id: session.id,
            user: session.user,
            remoteAddress: session.remoteAddress,
            selected: session.selected,
            acceptUTF8Enabled: session.isUTF8Enabled()
          },
          mailboxId,
          options
        });

      if (Array.isArray(compiledPayloads)) {
        for (const compiled of compiledPayloads) {
          session.writeStream.write(compiled);
        }
      }

      fn(null, bool, response);

      if (Array.isArray(entries) && entries.length > 0) {
        this.server.notifier
          .addEntries(this, session, mailboxId, entries)
          .then(() => this.server.notifier.fire(session.user.alias_id))
          .catch((err) =>
            this.logger.fatal(err, { session, resolver: this.resolver })
          );

        // send websocket push notification (implicit \Seen flag change)
        sendNotification(this.client, session.user.alias_id, 'flagsUpdated', {
          mailbox: mailboxId.toString(),
          action: 'add',
          flags: ['\\Seen'],
          uids: entries.map((e) => e.uid)
        });
      }
    } catch (err) {
      if (err.imapResponse) return fn(null, err.imapResponse);
      fn(err);
    }

    return;
  }

  try {
    const compiledPayloads = [];
    const entries = [];
    const ops = [];

    let rowCount = 0;
    let totalBytes = 0;
    let _lastFlushBytes = 0;

    await this.refreshSession(session, 'FETCH');

    const mailbox = await Mailboxes.findOne(this, session, {
      _id: mailboxId
    });

    if (!mailbox)
      throw new IMAPError(
        i18n.translate('IMAP_MAILBOX_DOES_NOT_EXIST', session.user.locale),
        {
          imapResponse: 'NONEXISTENT'
        }
      );

    const projection = {
      _id: true,
      uid: true,
      modseq: true,
      thread: true
    };

    if (options.flagsExist) {
      projection.flags = true;
      // Custom labels are exposed to IMAP clients as keywords alongside flags.
      // Without this, FETCH responses never include user-defined labels and
      // cross-device label visibility breaks for native IMAP clients.
      projection.labels = true;
    }

    if (options.idateExist) projection.idate = true;
    if (options.bodystructureExist) projection.bodystructure = true;
    if (options.rfc822sizeExist) projection.size = true;
    if (options.envelopeExist) projection.envelope = true;
    if (!options.metadataOnly) projection.mimeTree = true;

    const query = {
      mailbox: mailbox._id
    };

    if (options.changedSince)
      query.modseq = {
        $gt: options.changedSince
      };

    const pageQuery = { ...query };

    //
    // NOTE: if the uid is not in the selected list then we can assume client is requesting invalid data
    //       (e.g. `options.messages = [ 50 ]` when `50` doesn't exist, e.g. after COPY in Thunderbird)
    //

    let queryAll = false;

    /*
    // return early if no messages
    // (we could also do `_id: -1` as a query)
    if (options.messages.length === 0) {
      return fn(
        null,
        true,
        {
          rowCount,
          totalBytes
        },
        compiledPayloads,
        entries
      );
    }
    */

    if (
      !options.isUid &&
      options.messages.length === session.selected.uidList.length
    ) {
      // 1:*
      queryAll = true;
    } else {
      // do not use uid selector for 1:*
      pageQuery.uid = tools.checkRangeQuery(options.messages, false);
    }

    // converts objectids -> strings and arrays/json appropriately
    const condition = prepareQuery(Messages.mapping, pageQuery);

    // condition {
    //   mailbox: '6673762a02663ea16204767b',
    //   uid: {
    //     '$in': [
    //       4047, 4049, 4050, 4051, 4052, 4054, 4053, 4055, 4056, 4057,
    //       4058, 4059, 4060, 4061, 4062, 4063, 4064, 4048, 4066, 4065,
    //       4067, 4068, 4069, 4070, 4072, 4071, 4073, 4074, 4075, 4076,
    //       4077, 4078, 4079, 4080, 4081, 4082, 4083, 4084, 4085, 4087,
    //       4088, 4089, 4090, 4092, 4091, 4093, 4095, 4094, 4086, 4098,
    //       4101, 4099, 4102, 4103, 4106, 4104, 4105, 4100, 4107, 4108,
    //       4111, 4109, 4110, 4114, 4115, 4116, 4117, 4118, 4119, 4120,
    //       4123, 4125, 4122, 4127, 4130, 4121, 4124, 4126, 4132, 4129,
    //       4131, 4128, 4096, 4097, 4133, 4135, 4134, 4137, 4138, 4136,
    //       4139, 4140, 4141, 4142, 4144, 4146, 4143, 4145, 4148, 4147,
    //       ... 429 more items
    //     ]
    //   }
    // }

    // TODO: `condition` may need further refined for accuracy (e.g. see `prepareQuery`)
    const fields = [];
    for (const key of Object.keys(projection)) {
      if (projection[key] === true) fields.push(key);
    }

    // const count = await Messages.countDocuments(this, session, condition);

    //
    // Use LIMIT/OFFSET pagination instead of a single unbounded .all() to
    // prevent memory exhaustion.  A malicious or naive client can issue
    // FETCH 1:* (BODY[]) on a mailbox with thousands of messages — each
    // mimeTree blob can be 15 MB+, so loading them all at once would OOM
    // the process.  We fetch PAGE_SIZE rows per iteration, process them
    // (which involves async work like getQueryResponse), then
    // fetch the next page.  This keeps peak memory bounded.
    //
    // We still use .all() per page (not .iterate()) because the loop body
    // contains `await` calls and better-sqlite3 iterators hold a lock that
    // cannot span async boundaries.
    //
    // Use smaller pages for metadata-only queries (they're CPU-bound in
    // compileImapResponse) to avoid blocking the event loop for too long.
    // Full-body fetches already yield via stream I/O per message.
    const PAGE_SIZE = options.metadataOnly ? 500 : 2000;
    const sortClause = condition?.uid?.$eq ? undefined : 'uid';

    // convert uidList to Set for O(1) lookups instead of O(n) Array.includes
    const uidSet = queryAll ? new Set(session.selected.uidList) : null;

    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const pageSql = builder.build({
        type: 'select',
        table: 'Messages',
        condition,
        fields,
        sort: sortClause,
        limit: PAGE_SIZE,
        offset
      });
      const pageResults = session.db.prepare(pageSql.query).all(pageSql.values);
      if (pageResults.length < PAGE_SIZE) hasMore = false;
      offset += pageResults.length;
      if (pageResults.length === 0) break;

      let _rowsInPage = 0;
      for (const result of pageResults) {
        // Yield to the event loop every 100 rows to prevent macrotask
        // starvation (fixes 146-1184 ms EVENT_LOOP_LAG spikes during
        // large mailbox syncs)
        if (++_rowsInPage % 100 === 0) {
          await new Promise(setImmediate);
        }

        const message = syncConvertResult(Messages, result, projection);

        // don't process messages that are new since query started
        // <https://github.com/nodemailer/wildduck/issues/708>
        if (queryAll && !uidSet.has(message.uid)) {
          continue;
        }

        const markAsSeen =
          options.markAsSeen &&
          message.flags &&
          !message.flags.includes('\\Seen');
        if (markAsSeen) message.flags.unshift('\\Seen');

        // write the response early since we don't need to perform db operation
        if (options.metadataOnly && !markAsSeen) {
          const values = await Promise.all(
            getQueryResponse(
              options.query,
              message,
              {
                logger: this.logger,
                fetchOptions: {},
                // database
                attachmentStorage: this.attachmentStorage,
                acceptUTF8Enabled:
                  typeof session.isUTF8Enabled === 'function'
                    ? session.isUTF8Enabled()
                    : session.acceptUTF8Enabled || false
              },
              this,
              session
            )
          );

          const data = formatResponse.call(session, 'FETCH', message.uid, {
            query: options.query,
            values
          });
          const compiled = compileImapResponse(data);
          totalBytes += compiled.length;
          rowCount++;

          compiledPayloads.push({ compiled });

          // Flush at 500 messages OR 8MB accumulated, whichever comes first.
          if (
            compiledPayloads.length >= 500 ||
            totalBytes - _lastFlushBytes >= 8_388_608
          ) {
            await this.wss.broadcast(session, compiledPayloads);
            compiledPayloads.length = 0;
            _lastFlushBytes = totalBytes;
          }

          // move along to next cursor
          continue;
        }

        //
        // NOTE: wildduck uses streams and a TTL limiter/counter however we can
        // simplify this for now just by writing to the socket writable stream
        //

        const values = await Promise.all(
          getQueryResponse(
            options.query,
            message,
            {
              logger: this.logger,
              fetchOptions: {},
              // database
              attachmentStorage: this.attachmentStorage,
              acceptUTF8Enabled:
                typeof session.isUTF8Enabled === 'function'
                  ? session.isUTF8Enabled()
                  : session.acceptUTF8Enabled || false
            },
            this,
            session
          )
        );

        const data = formatResponse.call(session, 'FETCH', message.uid, {
          query: options.query,
          values
        });

        // <https://github.com/nodemailer/wildduck/issues/563#issuecomment-1826943401>
        // NOTE: compiler() has a known encoding bug with 8-bit content.
        // compileStream() + getStream.buffer() avoids the StringDecoder/join
        // overhead (86% of heap allocations) while preserving correct encoding.
        const stream = imapHandler.compileStream(data);
        const buf = await getStream.buffer(stream);
        const compiled = buf.toString('binary');
        totalBytes += buf.length;
        compiledPayloads.push({ compiled });
        // Flush at 500 messages OR 8MB accumulated, whichever comes first.
        // Count-only flushing allowed unbounded memory for large-body fetches.
        if (
          compiledPayloads.length >= 500 ||
          totalBytes - _lastFlushBytes >= 8_388_608
        ) {
          await this.wss.broadcast(session, compiledPayloads);
          compiledPayloads.length = 0;
          _lastFlushBytes = totalBytes;
        }

        rowCount++;

        if (markAsSeen) {
          // RFC 7162: Any flag change MUST update the message's mod-sequence
          // so CONDSTORE clients can detect the implicit \Seen change.
          const newModseq = mailbox.modifyIndex + 1;
          const sql = builder.build({
            type: 'update',
            table: 'Messages',
            condition: {
              _id: message._id.toString()
            },
            modifier: {
              $set: prepareQuery(Messages.mapping, {
                flags: message.flags,
                unseen: false,
                modseq: newModseq
              })
            }
          });
          ops.push([sql.query, sql.values]);

          entries.push({
            ignore: session.id,
            command: 'FETCH',
            uid: message.uid,
            flags: message.flags,
            message: message._id,
            thread: message.thread,
            modseq: newModseq,
            // unseenChange is true when marking as seen via FETCH
            unseenChange: true
          });
        }
      } // end for (pageResults)
    } // end while (hasMore)

    // perform db operations
    if (ops.length > 0) {
      session.db
        .transaction((ops) => {
          for (const op of ops) {
            session.db.prepare(op[0]).run(op[1]);
          }

          // RFC 7162: Update mailbox modifyIndex when markAsSeen changes flags
          const mbSql = builder.build({
            type: 'update',
            table: 'Mailboxes',
            condition: {
              _id: mailbox._id.toString()
            },
            modifier: {
              $set: { modifyIndex: mailbox.modifyIndex + 1 }
            }
          });
          session.db.prepare(mbSql.query).run(mbSql.values);
        })
        .immediate(ops);
    }

    fn(
      null,
      true,
      {
        rowCount,
        totalBytes
      },
      compiledPayloads,
      entries
    );

    // send websocket push notification (implicit \Seen flag change)
    if (entries.length > 0) {
      sendNotification(this.client, session.user.alias_id, 'flagsUpdated', {
        mailbox: mailboxId.toString(),
        action: 'add',
        flags: ['\\Seen'],
        uids: entries.map((e) => e.uid)
      });
    }
  } catch (err) {
    fn(refineAndLogError(err, session, true, this));
  }
}

module.exports = onFetch;
