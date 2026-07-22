/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const test = require('ava');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');

const {
  createAjaxFormWithTurnstile,
  resetTurnstile
} = require('../../assets/js/turnstile');

function createDom() {
  const dom = new JSDOM(`
    <form id="login" class="ajax-form">
      <div id="login-turnstile" class="cf-explicit-turnstile"></div>
    </form>
    <form id="register" class="ajax-form">
      <div id="register-turnstile" class="cf-explicit-turnstile"></div>
    </form>
  `);
  const $ = jquery(dom.window);
  $('#login-turnstile').data('widgetId', 'login-widget');
  $('#register-turnstile').data('widgetId', 'register-widget');
  return { $, dom };
}

test('resets only the submitted form after an AJAX attempt completes', async (t) => {
  const { $, dom } = createDom();
  const resetWidgetIds = [];
  let resolveRequest;
  const request = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const ajaxForm = async () => request;
  const handler = createAjaxFormWithTurnstile($, ajaxForm, () => ({
    reset(widgetId) {
      resetWidgetIds.push(widgetId);
    }
  }));
  const form = $('#login').get(0);
  const resultPromise = handler.call(form, { currentTarget: form });

  t.deepEqual(resetWidgetIds, []);
  resolveRequest('handled response');
  t.is(await resultPromise, 'handled response');
  t.deepEqual(resetWidgetIds, ['login-widget']);
  dom.window.close();
});

test('resets a consumed widget when the AJAX handler throws', async (t) => {
  const { $, dom } = createDom();
  const error = new Error('Invalid password');
  const resetWidgetIds = [];
  const handler = createAjaxFormWithTurnstile(
    $,
    async () => {
      throw error;
    },
    () => ({
      reset(widgetId) {
        resetWidgetIds.push(widgetId);
      }
    })
  );
  const form = $('#login').get(0);

  const thrown = await t.throwsAsync(
    handler.call(form, { currentTarget: form })
  );
  t.is(thrown, error);
  t.deepEqual(resetWidgetIds, ['login-widget']);
  dom.window.close();
});

test('does not reset during the initial confirmation prompt', async (t) => {
  const { $, dom } = createDom();
  const $form = $('#login').addClass('confirm-prompt');
  const resetWidgetIds = [];
  let resolveRequest;
  const request = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const ajaxForm = async (ev) => {
    if (!$(ev.currentTarget).data('confirmed')) return false;
    return request;
  };

  const handler = createAjaxFormWithTurnstile($, ajaxForm, () => ({
    reset(widgetId) {
      resetWidgetIds.push(widgetId);
    }
  }));
  const form = $form.get(0);

  t.false(await handler.call(form, { currentTarget: form }));
  t.deepEqual(resetWidgetIds, []);

  $form.data('confirmed', true);
  const resultPromise = handler.call(form, { currentTarget: form });
  $form.data('confirmed', false);
  resolveRequest('submitted');
  t.is(await resultPromise, 'submitted');
  t.deepEqual(resetWidgetIds, ['login-widget']);
  dom.window.close();
});

test('resetTurnstile ignores unavailable and unrendered widgets', (t) => {
  const { $, dom } = createDom();
  const $form = $('#login');
  $form.find('.cf-explicit-turnstile').removeData('widgetId');

  t.notThrows(() => resetTurnstile($, $form));
  t.notThrows(() => resetTurnstile($, $form, {}));
  t.notThrows(() =>
    resetTurnstile($, $form, {
      reset() {
        t.fail('unrendered widget must not be reset');
      }
    })
  );
  dom.window.close();
});

test('resetTurnstile supports a zero-valued widget ID', (t) => {
  const { $, dom } = createDom();
  const $form = $('#login');
  $form.find('.cf-explicit-turnstile').data('widgetId', 0);
  const resetWidgetIds = [];

  resetTurnstile($, $form, {
    reset(widgetId) {
      resetWidgetIds.push(widgetId);
    }
  });

  t.deepEqual(resetWidgetIds, [0]);
  dom.window.close();
});
