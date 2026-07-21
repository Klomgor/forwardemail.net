/*
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Synchronous IMAP response compiler that fixes the 8-bit encoding bug
 * in imapHandler.compiler() while avoiding the stream overhead of
 * compileStream() + getStream.buffer().
 *
 * This module is intended ONLY for metadata-only FETCH responses (FLAGS,
 * UID, ENVELOPE, BODYSTRUCTURE, etc.) where LITERAL values are always
 * strings (never streams).  For BODY[] fetches that may contain stream
 * LITERAL values, use compileStream() instead.
 */

'use strict';

const { Buffer } = require('node:buffer');
const imapFormalSyntax = require('@zone-eu/wildduck/imap-core/lib/handler/imap-formal-syntax');

// Pre-compute the ATOM-CHAR allowed characters string (it's a function)
// eslint-disable-next-line new-cap
const ATOM_CHARS = imapFormalSyntax['ATOM-CHAR']();

/**
 * Compile an IMAP response object to a binary string.
 * Drop-in replacement for imapHandler.compiler() that correctly handles
 * 8-bit content in LITERAL nodes using 'binary' encoding.
 *
 * The ONLY difference from the original compiler() is in the LITERAL case:
 * we use Buffer.from(value, 'binary').length for the byte count header
 * instead of .toString().length which miscounts multi-byte chars.
 *
 * @param {object} response - The parsed IMAP response object
 * @returns {string} Binary-encoded response string
 */
function compileImapResponse(response) {
  const respParts = [];
  let resp =
    (response.tag || '') + (response.command ? ' ' + response.command : '');
  let lastType;

  function walk(node, options) {
    options = options || {};

    if (
      lastType === 'LITERAL' ||
      (!'(<['.includes(resp.slice(-1)) && resp.length > 0)
    ) {
      if (options.subArray) {
        // ignore separator
      } else {
        resp += ' ';
      }
    }

    if (node && node.buffer && !Buffer.isBuffer(node)) {
      // mongodb binary
      node = node.buffer;
    }

    if (Array.isArray(node)) {
      lastType = 'LIST';
      resp += '(';
      let subArray = node.length > 1 && Array.isArray(node[0]);
      for (const child of node) {
        if (subArray && !Array.isArray(child)) {
          subArray = false;
        }

        walk(child, { subArray });
      }

      resp += ')';
      return;
    }

    if (node === null || node === undefined || node === false) {
      resp += 'NIL';
      return;
    }

    if (typeof node === 'string' || Buffer.isBuffer(node)) {
      resp += JSON.stringify(node.toString('binary'));
      return;
    }

    if (typeof node === 'number') {
      resp += Math.round(node) || 0;
      return;
    }

    lastType = node.type;

    switch (node.type.toUpperCase()) {
      case 'LITERAL': {
        if (node.value) {
          // Use Buffer to get correct byte length for 8-bit content
          const val = (node.value || '').toString('binary');
          const byteLen = Buffer.byteLength(val, 'binary');
          resp += '{' + Math.max(byteLen, 0) + '}\r\n';
        } else {
          resp += '{0}\r\n';
        }

        respParts.push(resp);
        resp = (node.value || '').toString('binary');
        break;
      }

      case 'STRING': {
        resp += JSON.stringify(node.value || '');
        break;
      }

      case 'TEXT':
      case 'SEQUENCE': {
        resp += (node.value || '').toString('binary');
        break;
      }

      case 'NUMBER': {
        resp += node.value || 0;
        break;
      }

      case 'ATOM':
      case 'SECTION': {
        let val = (node.value || '').toString('binary');
        if (
          imapFormalSyntax.verify(
            val.charAt(0) === '\\' ? val.slice(1) : val,
            ATOM_CHARS
          ) >= 0
        ) {
          val = JSON.stringify(val);
        }

        resp += val;
        if (node.section) {
          resp += '[';
          for (const child of node.section) {
            walk(child);
          }

          resp += ']';
        }

        if (node.partial) {
          resp += '<' + node.partial.join('.') + '>';
        }

        break;
      }

      default: {
        break;
      }
    }
  }

  for (const child of [response.attributes || []].flat()) walk(child);
  if (resp.length > 0) {
    respParts.push(resp);
  }

  return respParts.join('');
}

module.exports = compileImapResponse;
