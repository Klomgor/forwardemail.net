/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const Boom = require('@hapi/boom');
const isSANB = require('is-string-and-not-blank');
const qrcode = require('qrcode');
const { authenticator } = require('otplib');

const config = require('#config');

const options = { width: 500, margin: 0 };

// allow last and current totp passcode
authenticator.options = {
  window: 1
};

async function setup(ctx, next) {
  //
  // NOTE: if user has not verified email yet then do not permit OTP to be setup
  //
  if (!ctx.state.user[config.userFields.hasVerifiedEmail]) {
    ctx.flash('warning', ctx.translate('EMAIL_VERIFICATION_REQUIRED'));

    const redirectTo = ctx.state.l(config.verifyRoute);
    if (ctx.accepts('html')) ctx.redirect(redirectTo);
    else ctx.body = { redirectTo };

    return;
  }

  if (ctx.method === 'GET') return next();

  const { body } = ctx.request;

  if (ctx.state.user[config.userFields.hasSetPassword]) {
    if (!isSANB(body.password))
      throw Boom.badRequest(ctx.translateError('INVALID_PASSWORD'));

    const { user } = await ctx.state.user.authenticate(body.password);
    if (!user) throw Boom.badRequest(ctx.translateError('INVALID_PASSWORD'));
  }

  if (ctx.method === 'DELETE') {
    ctx.state.user[config.passport.fields.otpEnabled] = false;
    await ctx.state.user.save();
    ctx.flash('custom', {
      title: ctx.request.t('Success'),
      text: ctx.translate('REQUEST_OK'),
      type: 'success',
      toast: true,
      showConfirmButton: false,
      timer: 3000,
      position: 'top'
    });
    ctx.redirect(ctx.state.l('/my-account/security'));
    return;
  }

  if (isSANB(body.token)) {
    const { token } = ctx.request.body;
    const secret = ctx.state.user[config.passport.fields.otpToken];
    const isValid = authenticator.checkDelta(token, secret);

    // delta should be 0 for current, or -1 for last token
    if (isValid !== 0 && isValid !== -1) {
      ctx.flash('error', ctx.translate('INVALID_OTP_PASSCODE'));
      ctx.state.otpTokenURI = authenticator.keyuri(
        ctx.state.user.email,
        config.webHost,
        ctx.state.user[config.passport.fields.otpToken]
      );
      ctx.state.qrcode = await qrcode.toDataURL(ctx.state.otpTokenURI, options);
      return ctx.render('otp/enable');
    }

    ctx.state.user[config.passport.fields.otpEnabled] = true;
    await ctx.state.user.save();
    if (ctx.session) ctx.session.otp = 'totp-setup';
    ctx.flash('custom', {
      title: ctx.request.t('Success'),
      text: ctx.translate('REQUEST_OK'),
      type: 'success',
      toast: true,
      showConfirmButton: false,
      timer: 3000,
      position: 'top'
    });
    ctx.redirect(ctx.state.l('/my-account/security'));
    return;
  }

  ctx.state.otpTokenURI = authenticator.keyuri(
    ctx.state.user.email,
    config.webHost,
    ctx.state.user[config.passport.fields.otpToken]
  );
  ctx.state.qrcode = await qrcode.toDataURL(ctx.state.otpTokenURI, options);
  return ctx.render('otp/enable');
}

module.exports = setup;
