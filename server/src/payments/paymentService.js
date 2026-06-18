const env = require("../config/env");
const dummyProvider = require("./providers/dummyProvider");
const mobileMoneyProvider = require("./providers/mobileMoneyProvider.placeholder");

function providerFor(method) {
  if (method === "dummy") return dummyProvider;
  if (method === "mobile-money") return mobileMoneyProvider;
  if (env.paymentProvider && env.paymentProvider.toLowerCase().includes("momo")) return mobileMoneyProvider;
  return dummyProvider;
}

async function initiateSubscriptionPayment(context) {
  return providerFor(context.provider || "dummy").initiateSubscriptionPayment(context);
}

async function checkPaymentStatus(payment) {
  const method = payment.paymentMethod === "Mobile Money" || (payment.provider && payment.provider !== "dummy")
    ? "mobile-money"
    : "dummy";
  return providerFor(method).checkPaymentStatus(payment);
}

async function handlePaymentWebhook(payload, headers) {
  return mobileMoneyProvider.handlePaymentWebhook(payload, headers);
}

async function markPaymentSuccess(payment) {
  payment.status = "Success";
  payment.failureReason = undefined;
  payment.paidAt = payment.paidAt || new Date();
  await payment.save();
  return payment;
}

async function markPaymentFailed(payment, failureReason) {
  payment.status = "Failed";
  payment.failureReason = failureReason || payment.failureReason;
  await payment.save();
  return payment;
}

module.exports = {
  initiateSubscriptionPayment,
  checkPaymentStatus,
  handlePaymentWebhook,
  markPaymentSuccess,
  markPaymentFailed
};
