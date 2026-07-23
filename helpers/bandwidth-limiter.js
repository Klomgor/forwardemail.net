/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

/**
 * Reusable bandwidth rate limiter for IMAP, POP3, SMTP, CalDAV, and CardDAV.
 *
 * Design:
 *   - Single unified daily limit (50 GB) shared across ALL services per alias.
 *     This is simpler to reason about and prevents confusion about per-service
 *     caps. A user importing 10 GB via IMAP and sending 3 GB via SMTP uses
 *     13 GB of their 50 GB daily budget.
 *
 *   - Per-service hourly sub-limit (10 GB/hour) as a safety net against
 *     runaway scripts or compromised accounts on a single protocol.
 *
 * Limits are intentionally generous (well above Gmail) so users can:
 *   - Sync an entire mailbox on a new device without hitting walls
 *   - Import large backups (10+ GB) in a single day
 *   - Use multiple clients simultaneously
 *
 * The goal is flood/abuse prevention, not restricting legitimate usage.
 *
 * Redis keys use fixed-window counters with TTL expiry.
 * If Redis is unavailable, rate limiting is skipped (fail-open).
 */

const ms = require('ms');

const config = require('#config');

//
// Unified daily bandwidth limit shared across all services (bytes).
// 50 GB/day is generous enough for any legitimate use case while
// still catching flooding attacks or data exfiltration attempts.
//
const DAILY_LIMIT = 50 * 1024 * 1024 * 1024; // 50 GB

//
// Per-service hourly sub-limit (bytes).
// 10 GB/hour per service prevents a single runaway script from
// burning through the daily budget in minutes.
//
const HOURLY_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB

//
// Valid service names (used for hourly key scoping).
//
const SERVICES = new Set([
  'imap_download',
  'imap_upload',
  'pop3_download',
  'smtp_upload',
  'caldav',
  'carddav'
]);

//
// Lua script: atomic INCRBY with TTL set only on first increment.
// Prevents extending the window on every request (true fixed-window).
//
const INCRBY_SCRIPT = `
local current = redis.call('INCRBY', KEYS[1], ARGV[1])
if current == tonumber(ARGV[1]) then
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
return current
`;

/**
 * Check and increment bandwidth usage for a service.
 *
 * Uses two counters:
 *   1. A shared daily counter across all services (50 GB/day)
 *   2. A per-service hourly counter (10 GB/hour)
 *
 * @param {object} client - Redis client (ioredis instance)
 * @param {object} options
 * @param {string} options.aliasId - Alias ID (user identifier)
 * @param {string} options.service - Service name (one of SERVICES)
 * @param {number} options.bytes - Number of bytes to record
 * @returns {Promise<object>} { allowed, dailyUsed, hourlyUsed, dailyLimit, hourlyLimit }
 */
async function checkBandwidth(client, { aliasId, service, bytes: numBytes }) {
  // Fail-open: if no Redis client or no bytes, allow the request
  if (!client || !numBytes || numBytes <= 0) {
    return { allowed: true, dailyUsed: 0, hourlyUsed: 0 };
  }

  if (!SERVICES.has(service)) {
    return { allowed: true, dailyUsed: 0, hourlyUsed: 0 };
  }

  const now = new Date();
  const day = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const hour = `${day}T${String(now.getUTCHours()).padStart(2, '0')}`; // YYYY-MM-DDTHH

  // Shared daily key (all services combined)
  const dailyKey = `bw_${config.env}:all:d:${day}:${aliasId}`;
  // Per-service hourly key
  const hourlyKey = `bw_${config.env}:${service}:h:${hour}:${aliasId}`;

  try {
    // Atomic increment both counters via pipeline with Lua
    const results = await client
      .pipeline()
      .eval(INCRBY_SCRIPT, 1, dailyKey, numBytes, ms('1d'))
      .eval(INCRBY_SCRIPT, 1, hourlyKey, numBytes, ms('1h'))
      .exec();

    const dailyUsed = results[0][1];
    const hourlyUsed = results[1][1];

    // Check if either limit is exceeded
    if (dailyUsed > DAILY_LIMIT || hourlyUsed > HOURLY_LIMIT) {
      // Decrement since we're rejecting (best-effort, non-critical)
      client
        .pipeline()
        .decrby(dailyKey, numBytes)
        .decrby(hourlyKey, numBytes)
        .exec()
        .catch(() => {});

      return {
        allowed: false,
        dailyUsed: dailyUsed - numBytes,
        hourlyUsed: hourlyUsed - numBytes,
        dailyLimit: DAILY_LIMIT,
        hourlyLimit: HOURLY_LIMIT
      };
    }

    return {
      allowed: true,
      dailyUsed,
      hourlyUsed,
      dailyLimit: DAILY_LIMIT,
      hourlyLimit: HOURLY_LIMIT
    };
  } catch {
    // Fail-open on Redis errors (network partition, timeout, etc.)
    return { allowed: true, dailyUsed: 0, hourlyUsed: 0 };
  }
}

/**
 * Get current bandwidth usage without incrementing.
 *
 * @param {object} client - Redis client
 * @param {object} options
 * @param {string} options.aliasId - Alias ID
 * @param {string} options.service - Service name (for hourly lookup)
 * @returns {Promise<object>} { dailyUsed, hourlyUsed, dailyLimit, hourlyLimit }
 */
async function getBandwidthUsage(client, { aliasId, service }) {
  if (!client) {
    return { dailyUsed: 0, hourlyUsed: 0 };
  }

  if (!SERVICES.has(service)) {
    return { dailyUsed: 0, hourlyUsed: 0 };
  }

  const now = new Date();
  const day = now.toISOString().split('T')[0];
  const hour = `${day}T${String(now.getUTCHours()).padStart(2, '0')}`;

  const dailyKey = `bw_${config.env}:all:d:${day}:${aliasId}`;
  const hourlyKey = `bw_${config.env}:${service}:h:${hour}:${aliasId}`;

  try {
    const [dailyRaw, hourlyRaw] = await client
      .pipeline()
      .get(dailyKey)
      .get(hourlyKey)
      .exec();

    return {
      dailyUsed: Number.parseInt(dailyRaw[1], 10) || 0,
      hourlyUsed: Number.parseInt(hourlyRaw[1], 10) || 0,
      dailyLimit: DAILY_LIMIT,
      hourlyLimit: HOURLY_LIMIT
    };
  } catch {
    return { dailyUsed: 0, hourlyUsed: 0 };
  }
}

module.exports = {
  checkBandwidth,
  getBandwidthUsage,
  DAILY_LIMIT,
  HOURLY_LIMIT,
  SERVICES
};
