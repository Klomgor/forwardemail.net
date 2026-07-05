/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const test = require('ava');

const listUserSessions = require('#helpers/list-user-sessions');

const { parseUA } = listUserSessions;

// iOS frozen UA (iOS 26 reports iPhone OS 18_6)
test('parseUA: iOS 26 Safari (frozen UA)', (t) => {
  const ua =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
  const result = parseUA(ua);
  t.is(result.browser, 'Mobile Safari 26.0');
  t.is(result.os, 'iOS 26.0');
  t.is(result.short, 'Mobile Safari 26.0 on iOS 26.0');
});

// iOS 26.5 Safari
test('parseUA: iOS 26.5 Safari', (t) => {
  const ua =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1';
  const result = parseUA(ua);
  t.is(result.browser, 'Mobile Safari 26.5');
  t.is(result.os, 'iOS 26.5');
});

// macOS Safari (frozen at 10.15.7)
test('parseUA: macOS Safari (frozen at 10.15.7)', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15';
  const result = parseUA(ua);
  t.is(result.browser, 'Safari 26.5');
  t.is(result.os, 'macOS 26.5');
});

// macOS Chrome (frozen at 10.15.7, no client hints)
test('parseUA: macOS Chrome (frozen at 10.15.7, no hints)', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
  const result = parseUA(ua);
  t.is(result.browser, 'Chrome 136.0.0.0');
  // Without client hints, the frozen version is the best we can do
  t.is(result.os, 'macOS 10.15.7');
});

// macOS Chrome with Client Hints - should resolve real version
test('parseUA: macOS Chrome with Client Hints resolves real version', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
  const meta = {
    ch_platform: '"macOS"',
    ch_platform_version: '"15.5.0"'
  };
  const result = parseUA(ua, meta);
  t.is(result.browser, 'Chrome 149.0.0.0');
  t.is(result.os, 'macOS 15.5');
  t.is(result.short, 'Chrome 149.0.0.0 on macOS 15.5');
});

// macOS Edge with Client Hints
test('parseUA: macOS Edge with Client Hints resolves real version', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0';
  const meta = {
    ch_platform: '"macOS"',
    ch_platform_version: '"14.6.1"'
  };
  const result = parseUA(ua, meta);
  t.is(result.browser, 'Edge 149.0.0.0');
  t.is(result.os, 'macOS 14.6');
});

// Client hints with macOS 11 (Big Sur)
test('parseUA: macOS Chrome with Client Hints macOS 11', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
  const meta = {
    ch_platform: '"macOS"',
    ch_platform_version: '"11.7.10"'
  };
  const result = parseUA(ua, meta);
  t.is(result.os, 'macOS 11.7');
});

// Client hints where version is actually 10.15.7 (genuine Catalina)
test('parseUA: genuine Catalina with Client Hints confirming 10.15.7', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const meta = {
    ch_platform: '"macOS"',
    ch_platform_version: '"10.15.7"'
  };
  const result = parseUA(ua, meta);
  // Should stay at 10.15.7 since that's the real version
  t.is(result.os, 'macOS 10.15.7');
});

// Empty meta object (backward compatibility)
test('parseUA: backward compatible with no meta argument', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15';
  const result = parseUA(ua);
  t.is(result.os, 'macOS 26.5.2');
});

// Chrome on iOS (CriOS)
test('parseUA: Chrome on iOS (CriOS)', (t) => {
  const ua =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/136.0.7103.56 Mobile/15E148 Safari/604.1';
  const result = parseUA(ua);
  t.is(result.browser, 'Mobile Chrome 136.0.7103.56');
  t.is(result.os, 'iOS 18.6');
});

// Firefox on iOS (FxiOS)
test('parseUA: Firefox on iOS (FxiOS)', (t) => {
  const ua =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/136.0 Mobile/15E148 Safari/604.1';
  const result = parseUA(ua);
  t.is(result.browser, 'Mobile Firefox 136.0');
  t.is(result.os, 'iOS 18.6');
});

// Windows Chrome
test('parseUA: Windows Chrome', (t) => {
  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
  const result = parseUA(ua);
  t.is(result.browser, 'Chrome 136.0.0.0');
  t.is(result.os, 'Windows 10');
});

// Windows Firefox
test('parseUA: Windows Firefox', (t) => {
  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
  const result = parseUA(ua);
  t.is(result.browser, 'Firefox 128.0');
  t.is(result.os, 'Windows 10');
});

// Linux Firefox
test('parseUA: Linux Firefox', (t) => {
  const ua =
    'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';
  const result = parseUA(ua);
  t.is(result.browser, 'Firefox 128.0');
  t.is(result.os, 'Linux');
});

// Android Chrome
test('parseUA: Android Chrome', (t) => {
  const ua =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36';
  const result = parseUA(ua);
  t.is(result.browser, 'Mobile Chrome 136.0.0.0');
  t.is(result.os, 'Android 14');
});

// Edge on Windows
test('parseUA: Edge on Windows', (t) => {
  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0';
  const result = parseUA(ua);
  t.is(result.browser, 'Edge 136.0.0.0');
  t.is(result.os, 'Windows 10');
});

// Thunderbird (with Emails extension)
test('parseUA: Thunderbird on Linux', (t) => {
  const ua =
    'Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Thunderbird/102.15.1';
  const result = parseUA(ua);
  t.is(result.browser, 'Thunderbird 102.15.1');
  t.is(result.os, 'Linux');
});

// Samsung Internet
test('parseUA: Samsung Internet on Android', (t) => {
  const ua =
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';
  const result = parseUA(ua);
  t.is(result.browser, 'Samsung Internet 23.0');
  t.is(result.os, 'Android 13');
});

// Opera
test('parseUA: Opera on Windows', (t) => {
  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 OPR/100.0.0.0';
  const result = parseUA(ua);
  t.is(result.browser, 'Opera 100.0.0.0');
  t.is(result.os, 'Windows 10');
});

// Empty/null/undefined UA
test('parseUA: empty string', (t) => {
  const result = parseUA('');
  t.is(result.short, 'Unknown');
});

test('parseUA: null', (t) => {
  const result = parseUA(null);
  t.is(result.short, 'Unknown');
});

test('parseUA: undefined', (t) => {
  const result = parseUA(undefined);
  t.is(result.short, 'Unknown');
});

// iPadOS in desktop mode (reports as macOS - known limitation)
test('parseUA: iPadOS desktop mode (reports as macOS)', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
  const result = parseUA(ua);
  // iPadOS desktop mode sends Mobile token but reports as Macintosh
  // Frozen macOS version corrected via Version/ token
  t.is(result.browser, 'Mobile Safari 26.0');
  t.is(result.os, 'macOS 26.0');
});

// Vivaldi
test('parseUA: Vivaldi on Linux', (t) => {
  const ua =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Vivaldi/7.0';
  const result = parseUA(ua);
  t.is(result.browser, 'Vivaldi 7.0');
  t.is(result.os, 'Linux');
});

// Safari with full version (26.5.2)
test('parseUA: Safari 26.5.2 on macOS', (t) => {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15';
  const result = parseUA(ua);
  t.is(result.browser, 'Safari 26.5.2');
  t.is(result.os, 'macOS 26.5.2');
});
