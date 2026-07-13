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
  const to =
    session.user.username ||
    `${session.user.alias_name || session.user.alias_id || 'user'}@${
      session.user.domain_name || config.webHost || 'forwardemail.net'
    }`;
  const from = `"Forward Email" <support@${
    config.webHost || 'forwardemail.net'
  }>`;
  const host = config.webHost || 'forwardemail.net';
  const date = new Date().toUTCString();
  const messageId = `<welcome-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@${host}>`;
  const subject = 'Welcome to Forward Email';

  const textBody = [
    'Welcome to Forward Email!',
    '',
    `Your encrypted mailbox (${to}) is ready.`,
    '',
    '',
    'GET STARTED',
    '',
    `- FAQ: https://${host}/faq`,
    `- Import & Migrate Your Mailbox: https://${host}/faq#how-do-i-import-and-migrate-my-existing-mailbox`,
    `- Email Client Setup: https://${host}/faq#email-clients`,
    '',
    '',
    'MANAGE YOUR ACCOUNT',
    '',
    `- Create Aliases & Mailboxes: https://${host}/my-account/domains`,
    `- Account Security & Profile: https://${host}/my-account/security`,
    `- Billing & Plans: https://${host}/my-account/billing`,
    '',
    '',
    'LEARN MORE',
    '',
    `- Technical Whitepaper (PDF): https://${host}/technical-whitepaper.pdf`,
    `- Self-Hosting Guide: https://${host}/faq#do-you-support-self-hosting`,
    `- Privacy Policy: https://${host}/privacy`,
    `- Terms of Service: https://${host}/terms`,
    '',
    '',
    'CONNECT WITH US',
    '',
    `- Support & Help: https://${host}/help`,
    '- Matrix Chat: https://matrix.to/#/#forwardemail:matrix.org',
    '- Follow @fwdemail on X (Twitter): https://x.com/fwdemail',
    '- GitHub: https://github.com/forwardemail',
    '',
    '',
    'If you have any questions, simply reply to this email.',
    '',
    '\u2014 The Forward Email Team'
  ].join('\r\n');

  const htmlBody = [
    '<html><body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">',
    '<h2 style="color: #20c997;">Welcome to Forward Email!</h2>',
    `<p>Your encrypted mailbox (<strong>${to}</strong>) is ready.</p>`,
    '',
    '<h3>Get Started</h3>',
    '<ul style="line-height: 1.8;">',
    `<li><a href="https://${host}/faq">FAQ</a></li>`,
    `<li><a href="https://${host}/faq#how-do-i-import-and-migrate-my-existing-mailbox">Import &amp; Migrate Your Mailbox</a></li>`,
    `<li><a href="https://${host}/faq#email-clients">Email Client Setup</a> (Thunderbird, Outlook, Apple Mail, and more)</li>`,
    '</ul>',
    '',
    '<h3>Manage Your Account</h3>',
    '<ul style="line-height: 1.8;">',
    `<li><a href="https://${host}/my-account/domains">Create Aliases &amp; Mailboxes</a></li>`,
    `<li><a href="https://${host}/my-account/security">Account Security &amp; Profile</a></li>`,
    `<li><a href="https://${host}/my-account/billing">Billing &amp; Plans</a></li>`,
    '</ul>',
    '',
    '<h3>Learn More</h3>',
    '<ul style="line-height: 1.8;">',
    `<li><a href="https://${host}/technical-whitepaper.pdf">Technical Whitepaper</a> (PDF)</li>`,
    `<li><a href="https://${host}/faq#do-you-support-self-hosting">Self-Hosting Guide</a></li>`,
    `<li><a href="https://${host}/privacy">Privacy Policy</a></li>`,
    `<li><a href="https://${host}/terms">Terms of Service</a></li>`,
    '</ul>',
    '',
    '<h3>Connect With Us</h3>',
    '<ul style="line-height: 1.8;">',
    `<li><a href="https://${host}/help">Support &amp; Help</a></li>`,
    '<li><a href="https://matrix.to/#/#forwardemail:matrix.org">Matrix Chat Room</a></li>',
    '<li><a href="https://x.com/fwdemail">@fwdemail on X (Twitter)</a></li>',
    '<li><a href="https://github.com/forwardemail">GitHub</a></li>',
    '</ul>',
    '',
    '<p style="margin-top: 28px;">If you have any questions, simply reply to this email.</p>',
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
