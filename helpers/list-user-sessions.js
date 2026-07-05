/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const pMap = require('p-map');
const UAParser = require('ua-parser-js');
const { Emails } = require('ua-parser-js/extensions');

/**
 * Parse a user-agent string into a human-readable short description.
 * Uses ua-parser-js for detection (handles frozen iOS UA automatically)
 * and leverages Client Hints headers (when available) to resolve the real
 * OS version on Chromium browsers where the UA string is frozen at macOS 10.15.7.
 *
 * @param {string} ua - Raw user-agent string
 * @param {Object} [meta] - Session metadata containing client hints
 * @param {string} [meta.ch_platform] - Sec-CH-UA-Platform value (e.g. "macOS")
 * @param {string} [meta.ch_platform_version] - Sec-CH-UA-Platform-Version value (e.g. "15.5.0")
 * @returns {{ browser: string, os: string, short: string }}
 */
function parseUA(ua, meta = {}) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', short: 'Unknown' };

  const result = new UAParser(ua, { browser: Emails.browser }).getResult();

  let browser = 'Unknown';
  let os = 'Unknown';

  if (result.browser.name && result.browser.version) {
    browser = `${result.browser.name} ${result.browser.version}`;
  } else if (result.browser.name) {
    browser = result.browser.name;
  }

  if (result.os.name && result.os.version) {
    os = `${result.os.name} ${result.os.version}`;
  } else if (result.os.name) {
    os = result.os.name;
  }

  // If the OS version is still frozen at 10.15.7, attempt to resolve it
  // using Client Hints or the Safari Version/ token fallback.
  // All major browsers (Chrome, Firefox, Safari) freeze macOS at 10.15.7
  // in the UA string since Big Sur (2020).
  if (result.os.name === 'macOS' && result.os.version === '10.15.7') {
    // Strategy 1: Use Client Hints platform version (Chromium browsers).
    // The Accept-CH header requests Sec-CH-UA-Platform-Version from the
    // browser, which is stored in session metadata as ch_platform_version.
    if (meta.ch_platform_version) {
      // Client hints value is quoted, e.g. "15.5.0" — strip quotes
      const version = meta.ch_platform_version.replace(/"/g, '');
      if (version && version !== '10.15.7') {
        // Chromium sends full semver (e.g. "15.5.0"); show major.minor
        const parts = version.split('.');
        const majorMinor =
          parts.length >= 2 ? `${parts[0]}.${parts[1]}` : version;
        os = `macOS ${majorMinor}`;
      }
    }

    // Strategy 2: Safari Version/ token fallback (Safari on macOS).
    // Safari includes a Version/X.Y.Z token that matches the macOS major
    // version starting with macOS 11+.
    if (os === 'macOS 10.15.7') {
      const versionMatch = ua.match(/Version\/(\d+(?:\.\d+)+)/);
      if (versionMatch) {
        const safariMajor = Number.parseInt(versionMatch[1], 10);
        // Safari major matches macOS major starting with macOS 11+
        if (safariMajor > 10) {
          os = `macOS ${versionMatch[1]}`;
        }
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
        const ua = parseUA(meta.ua, meta);

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
