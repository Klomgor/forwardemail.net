/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

function resetTurnstile($, $form, turnstile) {
  if (!turnstile || typeof turnstile.reset !== 'function') return;

  $form.find('.cf-explicit-turnstile').each(function () {
    const widgetId = $(this).data('widgetId');
    if (typeof widgetId === 'undefined') return;
    turnstile.reset(widgetId);
  });
}

function createAjaxFormWithTurnstile(
  $,
  ajaxForm,
  getTurnstile = () => window.turnstile
) {
  return async function (ev) {
    const $form = $(ev.currentTarget);
    const requiresConfirmation =
      $form.hasClass('confirm-prompt') ||
      $form.data('toggle') === 'confirm-prompt';
    const shouldResetTurnstile =
      !requiresConfirmation || Boolean($form.data('confirmed'));

    try {
      return await ajaxForm.call(this, ev);
    } finally {
      if (shouldResetTurnstile) resetTurnstile($, $form, getTurnstile());
    }
  };
}

module.exports = {
  createAjaxFormWithTurnstile,
  resetTurnstile
};
