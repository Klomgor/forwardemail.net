/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const { Buffer } = require('node:buffer');

const config = require('#config');

//
// Generate a welcome email (RFC 5322 raw message) for first-time mailbox setup.
// This is inserted into INBOX on initial database creation so new users
// see a helpful message when they first connect their email client.
//
function getWelcomeEmail(session) {
  const address =
    session.user.username ||
    session.user.alias_name ||
    session.user.alias_id ||
    'user';
  const domain =
    session.user.domain_name || config.webHost || 'forwardemail.net';
  const to = `${address}@${domain}`;
  const from = `"Forward Email" <support@${
    config.webHost || 'forwardemail.net'
  }>`;
  const date = new Date().toUTCString();
  const messageId = `<welcome-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@${config.webHost || 'forwardemail.net'}>`;

  const subject = 'Welcome to Forward Email';

  const textBody = [
    `Welcome to Forward Email!`,
    '',
    `Your encrypted mailbox (${to}) is ready.`,
    '',
    'Here are some helpful links to get started:',
    '',
    `- FAQ: https://${config.webHost || 'forwardemail.net'}/faq`,
    `- Privacy Policy: https://${config.webHost || 'forwardemail.net'}/privacy`,
    `- Getting Started Guide: https://${
      config.webHost || 'forwardemail.net'
    }/guides`,
    '',
    'If you have any questions, simply reply to this email.',
    '',
    '— The Forward Email Team'
  ].join('\r\n');

  const htmlBody = [
    '<html><body>',
    '<h2>Welcome to Forward Email!</h2>',
    `<p>Your encrypted mailbox (<strong>${to}</strong>) is ready.</p>`,
    '<p>Here are some helpful links to get started:</p>',
    '<ul>',
    `<li><a href="https://${
      config.webHost || 'forwardemail.net'
    }/faq">FAQ</a></li>`,
    `<li><a href="https://${
      config.webHost || 'forwardemail.net'
    }/privacy">Privacy Policy</a></li>`,
    `<li><a href="https://${
      config.webHost || 'forwardemail.net'
    }/guides">Getting Started Guide</a></li>`,
    '</ul>',
    '<p>If you have any questions, simply reply to this email.</p>',
    '<p>&mdash; The Forward Email Team</p>',
    '</body></html>'
  ].join('\r\n');

  const boundary = `----=_Part_${Date.now().toString(36)}`;

  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
    ''
  ].join('\r\n');

  return Buffer.from(raw);
}

module.exports = getWelcomeEmail;
