/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

// <https://github.com/Kikobeats/localhost-url-regex/issues/9>
// <https://github.com/tinovyatkin/is-localhost-ip>

const IP_RANGES = [
  // 10.0.0.0 - 10.255.255.255
  /^(:{2}f{4}:)?10(?:\.\d{1,3}){3}$/,
  // 127.0.0.0 - 127.255.255.255
  /^(:{2}f{4}:)?127(?:\.\d{1,3}){3}$/,
  // 169.254.1.0 - 169.254.254.255
  /^(::f{4}:)?169\.254\.([1-9]|1?\d\d|2[0-4]\d|25[0-4])\.\d{1,3}$/,
  // 172.16.0.0 - 172.31.255.255
  /^(:{2}f{4}:)?(172\.1[6-9]|172\.2\d|172\.3[01])(?:\.\d{1,3}){2}$/,
  // 192.168.0.0 - 192.168.255.255
  /^(:{2}f{4}:)?192\.168(?:\.\d{1,3}){2}$/,
  // fc00::/7
  /^f[cd][\da-f]{2}(::1$|:[\da-f]{1,4}){1,7}$/,
  // fe80::/10
  /^fe[89ab][\da-f](::1$|:[\da-f]{1,4}){1,7}$/
];

module.exports = new RegExp(
  `^(${IP_RANGES.map((re) => re.source).join('|')})$`
);