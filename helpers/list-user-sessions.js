/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const pMap = require('p-map');
const UAParser = require('ua-parser-js');
const { Emails } = require('ua-parser-js/extensions');

/**
 * Parse a user-agent string into a human-readable short description.
 * Uses ua-parser-js for detection (handles frozen iOS UA automatically).
 *
 * @param {string} ua - Raw user-agent string
 * @returns {{ browser: string, os: string, short: string }}
 */
function parseUA(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', short: 'Unknown' };

  const result = new UAParser(ua, { browser: Emails.browser }).getResult();

  let browser = 'Unknown';
  let os = 'Unknown';

  if (result.browser.name && result.browser.version) {
    browser = `${result.browser.name} ${result.browser.major}`;
  } else if (result.browser.name) {
    browser = result.browser.name;
  }

  if (result.os.name && result.os.version) {
    os = `${result.os.name} ${result.os.version}`;
  } else if (result.os.name) {
    os = result.os.name;
  }

  // macOS version is frozen at 10.15.7 in the UA string since Big Sur (2020).
  // Use the Safari Version/ token to infer the real macOS version when frozen.
  if (result.os.name === 'macOS' && result.os.version === '10.15.7') {
    const versionMatch = ua.match(/Version\/(\d+\.\d+)/);
    if (versionMatch) {
      const safariMajor = Number.parseInt(versionMatch[1], 10);
      // Safari major matches macOS major starting with macOS 11+
      if (safariMajor > 10) {
        os = `macOS ${versionMatch[1]}`;
      }
    }
  }

  const short =
    browser === 'Unknown' && os === 'Unknown'
      ? 'Unknown'
      : `${browser} on ${os}`;
  return { browser, os, short };
}

/**
 * List all active sessions for a user with metadata.
 *
 * @param {Object} ctx - Koa context (needs ctx.client for Redis, ctx.sessionId)
 * @param {Object} user - User document (needs user.sessions array)
 * @returns {Promise<Array>} Array of session objects
 */
async function listUserSessions(ctx, user) {
  if (
    !ctx.client ||
    !Array.isArray(user.sessions) ||
    user.sessions.length === 0
  )
    return [];

  const sessions = await pMap(
    user.sessions,
    async (id) => {
      try {
        const value = await ctx.client.get(`koa:sess:${id}`);
        if (!value) return null;

        const json = JSON.parse(value);
        // Only include sessions that belong to this user
        if (json?.passport?.user !== user.id) return null;
        // Exclude admin impersonation sessions
        if (json._admin_impersonation) return null;

        const meta = json._meta || {};
        const ua = parseUA(meta.ua);

        return {
          id,
          is_current: id === ctx.sessionId,
          ip: meta.ip || 'Unknown',
          ua_raw: meta.ua || '',
          ua_short: ua.short,
          browser: ua.browser,
          os: ua.os,
          created_at: meta.created_at || null,
          last_active: meta.last_active || null
        };
      } catch {
        return null;
      }
    },
    { concurrency: 10 }
  );

  // Filter out null entries (expired/invalid sessions) and sort current first
  return sessions.filter(Boolean).sort((a, b) => {
    if (a.is_current) return -1;
    if (b.is_current) return 1;
    // Most recently active first
    return (b.last_active || '').localeCompare(a.last_active || '');
  });
}

// Export parseUA for testing
listUserSessions.parseUA = parseUA;
module.exports = listUserSessions;
