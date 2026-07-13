/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const ms = require('ms');
const pWaitFor = require('p-wait-for');
const { ImapFlow } = require('imapflow');

//
// Connection error codes thrown by ImapFlow when the socket dies:
// - 'NoConnection'      → run() finds socket destroyed before command starts
// - 'EConnectionClosed' → fetch() iterator detects socket death mid-stream
// - 'ENotFinished'      → FETCH command never completed normally
//
const CONNECTION_ERROR_CODES = new Set([
  'NoConnection',
  'EConnectionClosed',
  'ENotFinished'
]);

async function getMessage(imapClient, info, provider) {
  let received;
  let err;
  let client = imapClient;

  try {
    await pWaitFor(
      async () => {
        try {
          //
          // Guard: if the connection became unusable (e.g. server closed it
          // under load), create a fresh ImapFlow instance and reconnect.
          // ImapFlow instances are single-use — once closed, connect() cannot
          // be called again on the same object.
          //
          if (!client.usable) {
            try {
              client.close();
            } catch {}

            client = new ImapFlow({
              ...provider.config,
              socketTimeout: ms('1d')
            });
            await client.connect();
            await client.mailboxOpen('INBOX');
          }

          //
          // Issue NOOP to force the server to send pending EXISTS/RECENT
          // notifications.  Without this, the client's view of the mailbox
          // may be stale and fetch('1:*') won't see newly arrived messages.
          //
          await client.noop();

          //
          // Scan all messages in the mailbox.  Both the direct and forwarded
          // messages land in the same INBOX, and either may arrive first —
          // so we must scan all messages (not just '*' / last) to find our
          // specific target Message-ID regardless of arrival order.
          //
          for await (const message of client.fetch('1:*', {
            headers: ['Message-ID']
          })) {
            if (received) continue;
            if (
              message.headers &&
              message.headers
                .toString()
                .includes(
                  info.messageId.replace('<', '').replace('>', '').split('@')[1]
                )
            ) {
              //
              // NOTE: due to NTP time differences we cannot rely on
              //       a message's internal date from a given provider
              //       nor can we rely on Recieved headers
              //       nor can we rely on message envelope date
              //
              received = new Date();
            }
          }
        } catch (_err) {
          //
          // If the connection died mid-poll, mark client as unusable so the
          // next iteration will reconnect.  Do NOT throw — let pWaitFor retry.
          //
          if (CONNECTION_ERROR_CODES.has(_err.code)) {
            try {
              client.close();
            } catch {}

            // Return false so pWaitFor retries on next interval
            return false;
          }

          // For non-connection errors, propagate to stop polling
          err = _err;
        }

        if (err) throw err;

        return Boolean(received);
      },
      {
        interval: 0,
        timeout: ms('1m')
      }
    );
  } catch (_err) {
    err = _err;
  }

  return { provider, received, err, client };
}

module.exports = getMessage;
