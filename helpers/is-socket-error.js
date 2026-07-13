/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const SOCKET_ERROR_CODES = new Set([
  'ENOTCONN',
  'ENOTSOCK',
  'HPE_INVALID_METHOD',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'ERR_STREAM_PREMATURE_CLOSE',
  'ERR_HTTP2_SESSION_ERROR',
  'ERR_HTTP2_INVALID_SESSION',
  'ECONNRESET',
  'EPIPE'
]);

function isSocketError(err) {
  if (typeof err !== 'object') return false;

  if (typeof err.code === 'string' && SOCKET_ERROR_CODES.has(err.code))
    return true;

  for (const key of ['message', 'response']) {
    if (typeof err[key] !== 'string') continue;
    if (
      err[key].includes('Connection closed') ||
      err[key].includes('Connection pool was closed') ||
      err[key].includes('Connection closed unexpectedly') ||
      err[key].includes('Socket closed unexpectedly') ||
      err[key].includes('Unexpected socket close') ||
      err[key].includes('socket is already destroyed') ||
      err[key].includes('socket is already half-closed') ||
      err[key].includes('other side closed') ||
      err[key].includes('Premature close') ||
      err[key].includes('write EPIPE') ||
      err[key].includes('read ECONNRESET') ||
      err[key].includes('Connect Timeout Error') ||
      err[key].includes('Session closed with error code') ||
      err[key].includes('Parse Error: Invalid method encountered')
    )
      return true;
  }

  return false;
}

module.exports = isSocketError;
