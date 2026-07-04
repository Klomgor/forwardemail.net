/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const pMap = require('p-map');

/**
 * Parse a user-agent string into a human-readable short description.
 * Intentionally simple — no external dependency required.
 */
function parseUA(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', short: 'Unknown' };

  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect OS (order matters — check mobile before desktop since iOS UAs
  // contain "like Mac OS X" which would otherwise match the macOS branch)
  if (/iPhone|iPad|iPod/.test(ua)) {
    const m = ua.match(/OS ([\d_]+)/);
    os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Android ([\d.]+)/.test(ua)) {
    os = `Android ${RegExp.$1}`;
  } else if (/Windows NT 10/.test(ua)) os = 'Windows 10+';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua) && /Mobile/.test(ua)) {
    // iPadOS/iPhone in desktop-site mode sends a macOS UA but keeps "Mobile"
    const m = ua.match(/Mac OS X ([\d_]+)/);
    os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Mac OS X/.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    os = m ? `macOS ${m[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  // Detect browser (order matters — check specific before generic)
  if (/Edg(?:e|A|iOS)?\/([\d.]+)/.test(ua)) browser = `Edge ${RegExp.$1}`;
  else if (/OPR\/([\d.]+)/.test(ua)) browser = `Opera ${RegExp.$1}`;
  else if (/Vivaldi\/([\d.]+)/.test(ua)) browser = `Vivaldi ${RegExp.$1}`;
  else if (/Brave/.test(ua)) browser = 'Brave';
  else if (/Firefox\/([\d.]+)/.test(ua)) browser = `Firefox ${RegExp.$1}`;
  else if (/Chrome\/([\d.]+)/.test(ua)) browser = `Chrome ${RegExp.$1}`;
  else if (/Safari\/([\d.]+)/.test(ua) && /Version\/([\d.]+)/.test(ua))
    browser = `Safari ${RegExp.$1}`;
  else if (/Thunderbird\/([\d.]+)/.test(ua))
    browser = `Thunderbird ${RegExp.$1}`;

  const short = `${browser} on ${os}`;
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

module.exports = listUserSessions;
