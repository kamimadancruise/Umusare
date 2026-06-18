const env = require("../../config/env");

function createNotConfiguredError() {
  const error = new Error("Real Mobile Money provider is not configured.");
  error.statusCode = 501;
  return error;
}

function isConfigured() {
  return Boolean(
    env.realPaymentsEnabled
      && env.paymentProvider
      && env.momoApiBaseUrl
      && env.momoApiKey
      && env.momoApiSecret
      && env.momoCallbackUrl
      && env.momoCurrency
  );
}

async function initiateSubscriptionPayment() {
  if (!isConfigured()) throw createNotConfiguredError();

  // TODO: Implement after Umusare receives official provider sandbox docs:
  // - provider base URL from MOMO_API_BASE_URL
  // - API key/client ID from MOMO_API_KEY
  // - API secret from MOMO_API_SECRET
  // - merchant ID from MOMO_MERCHANT_ID if required
  // - callback/webhook URL from MOMO_CALLBACK_URL
  // - transaction reference mapping
  // - phone number formatting for Rwanda Mobile Money
  // - RWF currency enforcement
  // - sandbox vs production mode from PAYMENT_ENV
  throw createNotConfiguredError();
}

async function checkPaymentStatus() {
  if (!isConfigured()) throw createNotConfiguredError();
  // TODO: Call provider status endpoint once provider documentation is available.
  throw createNotConfiguredError();
}

async function handlePaymentWebhook() {
  if (!isConfigured()) throw createNotConfiguredError();
  // TODO: Verify webhook signature and parse provider payload once docs are available.
  throw createNotConfiguredError();
}

module.exports = {
  initiateSubscriptionPayment,
  checkPaymentStatus,
  handlePaymentWebhook,
  isConfigured
};
