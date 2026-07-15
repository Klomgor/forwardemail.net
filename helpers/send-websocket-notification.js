/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

// Backward-compatible module name for integrations that have not yet migrated.
// New code must use `send-notification`, which coordinates both WebSocket and
// push delivery from one Redis event with one immutable notificationId.
module.exports = require('#helpers/send-notification');
