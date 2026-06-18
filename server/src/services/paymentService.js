const DummyPayment = require("../models/DummyPayment");
const Subscription = require("../models/Subscription");
const AdminAuditLog = require("../models/AdminAuditLog");
const generatePaymentId = require("../utils/paymentNumber");
const subscriptionService = require("./subscriptionService");
const providerPaymentService = require("../payments/paymentService");
const env = require("../config/env");

const VALID_SIMULATED_STATUSES = ["Success", "Failed", "Pending"];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function safePayment(payment) {
  const subscription = payment.subscriptionId || {};
  return {
    id: payment._id,
    paymentId: payment.paymentId,
    subscriptionId: subscription.subscriptionId || payment.subscriptionId,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod: payment.paymentMethod,
    provider: payment.provider,
    providerTransactionId: payment.providerTransactionId,
    externalReference: payment.externalReference,
    status: payment.status,
    transactionReference: payment.transactionReference,
    phoneNumber: payment.phoneNumber,
    failureReason: payment.failureReason,
    webhookReceivedAt: payment.webhookReceivedAt,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt
  };
}

function normalizePhone(phoneNumber) {
  return String(phoneNumber || "").replace(/\s+/g, "").trim();
}

function assertSubscriptionAmount(subscription) {
  const planConfig = subscriptionService.PLAN_CONFIG[subscription.plan];
  if (!planConfig || Number(subscription.monthlyFee) !== Number(planConfig.monthlyFee)) {
    throw createHttpError("Subscription amount does not match the selected plan.", 409);
  }
}

async function createDummySubscriptionPayment(user, input) {
  if (!input.subscriptionId) throw createHttpError("Subscription ID is required");
  if (!input.phoneNumber) throw createHttpError("Phone number is required");
  if (!VALID_SIMULATED_STATUSES.includes(input.simulateStatus)) throw createHttpError("Simulated status must be Success, Failed, or Pending");
  const subscription = await subscriptionService.findSubscription(input.subscriptionId);
  if (String(subscription.driverUserId) !== String(user._id)) throw createHttpError("Not authorized to pay this subscription", 403);
  const payment = await DummyPayment.create({
    paymentId: await generatePaymentId(),
    userId: user._id,
    subscriptionId: subscription._id,
    amount: subscription.monthlyFee,
    currency: "RWF",
    paymentMethod: "Dummy Mobile Money",
    provider: "dummy",
    status: input.simulateStatus,
    transactionReference: "DUMMY-" + Date.now(),
    externalReference: "DUMMY-" + Date.now(),
    phoneNumber: normalizePhone(input.phoneNumber),
    paidAt: input.simulateStatus === "Success" ? new Date() : undefined
  });
  const providerResult = await providerPaymentService.initiateSubscriptionPayment({
    provider: "dummy",
    payment,
    subscription,
    user,
    phoneNumber: payment.phoneNumber
  });
  payment.providerTransactionId = providerResult.providerTransactionId || payment.transactionReference;
  payment.externalReference = payment.externalReference || providerResult.externalReference;
  payment.rawProviderResponse = providerResult.rawProviderResponse;
  await payment.save();
  let driver = subscription.driverId;
  if (input.simulateStatus === "Success") {
    const activated = await subscriptionService.activateSubscriptionAfterPayment(subscription, payment._id, "Dummy Paid");
    driver = activated.driver;
  } else if (input.simulateStatus === "Failed") {
    subscription.paymentStatus = "Failed";
    subscription.status = "Pending";
    await subscription.save();
  }
  return {
    payment: safePayment(payment),
    subscription: subscriptionService.safeSubscription(subscription, driver),
    profileVisibility: driver && driver.profileVisibility
  };
}

async function initiateMobileMoneySubscriptionPayment(user, input) {
  if (!env.realPaymentsEnabled) {
    throw createHttpError("Real Mobile Money payments are not enabled. Use dummy payment in test mode.", 403);
  }
  if (!input.subscriptionId) throw createHttpError("Subscription ID is required");
  if (!input.phoneNumber) throw createHttpError("Phone number is required");

  const subscription = await subscriptionService.findSubscription(input.subscriptionId);
  if (String(subscription.driverUserId) !== String(user._id)) throw createHttpError("Not authorized to pay this subscription", 403);
  assertSubscriptionAmount(subscription);

  const payment = await DummyPayment.create({
    paymentId: await generatePaymentId(),
    userId: user._id,
    subscriptionId: subscription._id,
    amount: subscription.monthlyFee,
    currency: "RWF",
    paymentMethod: "Mobile Money",
    provider: env.paymentProvider || "mobile-money",
    status: "Processing",
    transactionReference: "MOMO-" + Date.now(),
    externalReference: "MOMO-" + Date.now(),
    phoneNumber: normalizePhone(input.phoneNumber)
  });

  const providerResult = await providerPaymentService.initiateSubscriptionPayment({
    provider: "mobile-money",
    payment,
    subscription,
    user,
    phoneNumber: payment.phoneNumber
  });

  payment.providerTransactionId = providerResult.providerTransactionId;
  payment.externalReference = providerResult.externalReference || payment.externalReference;
  payment.rawProviderResponse = providerResult.rawProviderResponse;
  await payment.save();

  return {
    payment: safePayment(payment),
    subscription: subscriptionService.safeSubscription(subscription, subscription.driverId),
    message: "Mobile Money payment initiated."
  };
}

async function listMyPayments(user) {
  const payments = await DummyPayment.find({ userId: user._id }).sort({ createdAt: -1 }).populate("subscriptionId", "subscriptionId plan");
  return { payments: payments.map(safePayment) };
}

async function adminListPayments(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.subscriptionId) filter.subscriptionId = query.subscriptionId;
  if (query.driverId) {
    const subscriptions = await Subscription.find({ driverId: query.driverId }).select("_id");
    filter.subscriptionId = { $in: subscriptions.map(function (subscription) { return subscription._id; }) };
  }
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }
  const [payments, total] = await Promise.all([
    DummyPayment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("subscriptionId", "subscriptionId plan").populate("userId", "fullName phone email"),
    DummyPayment.countDocuments(filter)
  ]);
  let rows = payments.map(function (payment) {
    const row = safePayment(payment);
    row.driverName = payment.userId && payment.userId.fullName;
    return row;
  });
  if (query.search) {
    const term = String(query.search).toLowerCase();
    rows = rows.filter(function (row) { return [row.paymentId, row.driverName, row.status, row.phoneNumber].join(" ").toLowerCase().includes(term); });
  }
  return { payments: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function findPayment(paymentId) {
  const query = paymentId && paymentId.match(/^[a-f0-9]{24}$/i) ? { _id: paymentId } : { paymentId };
  const payment = await DummyPayment.findOne(query).populate("subscriptionId").populate("userId", "fullName phone email");
  if (!payment) throw createHttpError("Payment not found", 404);
  return payment;
}

async function getPaymentStatus(user, paymentId) {
  const payment = await findPayment(paymentId);
  const isOwner = String(payment.userId && payment.userId._id ? payment.userId._id : payment.userId) === String(user._id);
  if (user.role !== "admin" && !isOwner) throw createHttpError("Not authorized to view this payment", 403);
  if (payment.provider && payment.provider !== "dummy" && env.realPaymentsEnabled) {
    await providerPaymentService.checkPaymentStatus(payment);
  }
  return { payment: safePayment(payment) };
}

async function handleMobileMoneyWebhook(payload, headers) {
  // TODO: Verify webhook signature using provider documentation before enabling real payments.
  const providerResult = await providerPaymentService.handlePaymentWebhook(payload, headers);
  const reference = providerResult.providerTransactionId || providerResult.externalReference || payload.providerTransactionId || payload.externalReference;
  if (!reference) throw createHttpError("Payment reference is required", 400);

  const payment = await DummyPayment.findOne({
    $or: [
      { providerTransactionId: reference },
      { externalReference: reference },
      { transactionReference: reference },
      { paymentId: reference }
    ]
  }).populate("subscriptionId");
  if (!payment) throw createHttpError("Payment not found", 404);

  payment.webhookReceivedAt = new Date();
  if (providerResult.status === "Success") {
    await providerPaymentService.markPaymentSuccess(payment);
    if (payment.subscriptionId) await subscriptionService.activateSubscriptionAfterPayment(payment.subscriptionId, payment._id, "Paid");
  } else if (providerResult.status === "Failed") {
    await providerPaymentService.markPaymentFailed(payment, providerResult.failureReason || "Provider reported payment failure");
  } else {
    payment.status = providerResult.status || payment.status;
    await payment.save();
  }

  return { payment: safePayment(payment) };
}

async function audit(adminUser, action, payment, description, metadata = {}) {
  await AdminAuditLog.create({ adminUserId: adminUser._id, action, targetType: "DummyPayment", targetId: String(payment._id), description, metadata });
}

async function adminGetPayment(paymentId) {
  const payment = await findPayment(paymentId);
  return { payment: Object.assign(safePayment(payment), { driverName: payment.userId && payment.userId.fullName }) };
}

async function adminMarkSuccess(adminUser, paymentId) {
  const payment = await findPayment(paymentId);
  await providerPaymentService.markPaymentSuccess(payment);
  if (payment.subscriptionId) await subscriptionService.activateSubscriptionAfterPayment(payment.subscriptionId, payment._id, payment.paymentMethod === "Mobile Money" ? "Paid" : "Dummy Paid");
  await audit(adminUser, "MARK_PAYMENT_SUCCESS", payment, "Admin marked payment successful", { paymentMethod: payment.paymentMethod });
  return adminGetPayment(paymentId);
}

async function adminMarkFailed(adminUser, paymentId) {
  const payment = await findPayment(paymentId);
  payment.status = "Failed";
  await payment.save();
  if (payment.subscriptionId && payment.subscriptionId.status !== "Active") {
    payment.subscriptionId.paymentStatus = "Failed";
    payment.subscriptionId.status = "Pending";
    await payment.subscriptionId.save();
  }
  await audit(adminUser, "MARK_PAYMENT_FAILED", payment, "Admin marked payment failed", { paymentMethod: payment.paymentMethod });
  return adminGetPayment(paymentId);
}

module.exports = {
  createDummySubscriptionPayment,
  initiateMobileMoneySubscriptionPayment,
  listMyPayments,
  getPaymentStatus,
  handleMobileMoneyWebhook,
  adminListPayments,
  adminGetPayment,
  adminMarkSuccess,
  adminMarkFailed
};
