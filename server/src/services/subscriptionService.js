const Subscription = require("../models/Subscription");
const DriverProfile = require("../models/DriverProfile");
const AdminAuditLog = require("../models/AdminAuditLog");
const generateSubscriptionId = require("../utils/subscriptionNumber");

const PLAN_CONFIG = {
  Basic: { monthlyFee: 2500, driverBadge: "Verified Driver" },
  Pro: { monthlyFee: 5000, driverBadge: "Pro Driver" }
};

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function nextMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
}

function safeSubscription(subscription, driver) {
  if (!subscription) return null;
  return {
    id: subscription._id,
    subscriptionId: subscription.subscriptionId,
    driverId: subscription.driverId,
    plan: subscription.plan,
    monthlyFee: subscription.monthlyFee,
    currency: subscription.currency,
    status: subscription.status,
    startedAt: subscription.startedAt,
    renewalDate: subscription.renewalDate,
    expiredAt: subscription.expiredAt,
    cancelledAt: subscription.cancelledAt,
    paymentStatus: subscription.paymentStatus,
    bookingsUsedThisMonth: subscription.bookingsUsedThisMonth,
    profileVisibility: driver && driver.profileVisibility,
    canAppearPublicly: Boolean(driver && driver.isApproved && !driver.isSuspended && driver.verificationStatus === "Verified" && driver.profileVisibility === "Visible" && subscription.status === "Active")
  };
}

async function getDriverProfile(user) {
  const driver = await DriverProfile.findOne({ userId: user._id }).populate("userId", "fullName phone email");
  if (!driver) throw createHttpError("Your driver profile is not approved yet.", 404);
  return driver;
}

async function applyVisibilityForSubscription(driver, subscription) {
  if (!driver) return null;
  if (subscription.status === "Active" && driver.isApproved && !driver.isSuspended && driver.verificationStatus === "Verified") {
    driver.profileVisibility = "Visible";
  }
  if (["Expired", "Cancelled", "Pending"].includes(subscription.status)) {
    driver.profileVisibility = "Hidden";
  }
  if (subscription.plan && PLAN_CONFIG[subscription.plan]) {
    driver.driverBadge = PLAN_CONFIG[subscription.plan].driverBadge;
  }
  await driver.save();
  return driver;
}

async function getOwnSubscription(user) {
  const driver = await getDriverProfile(user);
  const subscription = await Subscription.findOne({ driverId: driver._id }).sort({ createdAt: -1 });
  return {
    message: subscription ? "Subscription loaded" : "No active subscription found.",
    subscription: safeSubscription(subscription, driver),
    profileVisibilityImpact: driver.profileVisibility === "Visible" ? "Your profile can appear publicly." : "Your profile is hidden until approval and active subscription."
  };
}

async function selectPlan(user, plan) {
  if (!PLAN_CONFIG[plan]) throw createHttpError("Plan must be Basic or Pro");
  const driver = await getDriverProfile(user);
  let subscription = await Subscription.findOne({ driverId: driver._id }).sort({ createdAt: -1 });
  if (!subscription) {
    subscription = await Subscription.create({
      subscriptionId: await generateSubscriptionId(),
      driverId: driver._id,
      driverUserId: user._id,
      plan,
      monthlyFee: PLAN_CONFIG[plan].monthlyFee,
      currency: "RWF",
      status: "Pending",
      paymentStatus: "Pending"
    });
  } else {
    subscription.plan = plan;
    subscription.monthlyFee = PLAN_CONFIG[plan].monthlyFee;
    subscription.currency = "RWF";
    subscription.status = "Pending";
    subscription.paymentStatus = "Pending";
    subscription.expiredAt = undefined;
    subscription.cancelledAt = undefined;
    await subscription.save();
  }
  await applyVisibilityForSubscription(driver, subscription);
  return { subscription: safeSubscription(subscription, driver), message: "Please complete dummy payment to activate your subscription." };
}

async function activateSubscription(subscription, paymentStatus = "Dummy Paid") {
  subscription.status = "Active";
  subscription.paymentStatus = paymentStatus;
  subscription.startedAt = subscription.startedAt || new Date();
  subscription.renewalDate = nextMonth();
  subscription.expiredAt = undefined;
  subscription.cancelledAt = undefined;
  await subscription.save();
  const driver = await DriverProfile.findById(subscription.driverId && subscription.driverId._id ? subscription.driverId._id : subscription.driverId);
  await applyVisibilityForSubscription(driver, subscription);
  return { subscription, driver };
}

async function activateSubscriptionAfterPayment(subscriptionId, paymentId, paymentStatus = "Paid") {
  const subscription = typeof subscriptionId === "object" && subscriptionId._id
    ? subscriptionId
    : await findSubscription(subscriptionId);
  const result = await activateSubscription(subscription, paymentStatus);
  return Object.assign(result, { paymentId });
}

async function expireSubscription(subscription) {
  subscription.status = "Expired";
  subscription.expiredAt = new Date();
  await subscription.save();
  const driver = await DriverProfile.findById(subscription.driverId && subscription.driverId._id ? subscription.driverId._id : subscription.driverId);
  await applyVisibilityForSubscription(driver, subscription);
  return { subscription, driver };
}

async function cancelSubscription(subscription, reason) {
  if (!reason) throw createHttpError("Cancellation reason is required");
  subscription.status = "Cancelled";
  subscription.cancelledAt = new Date();
  await subscription.save();
  const driver = await DriverProfile.findById(subscription.driverId && subscription.driverId._id ? subscription.driverId._id : subscription.driverId);
  await applyVisibilityForSubscription(driver, subscription);
  return { subscription, driver };
}

async function findSubscription(subscriptionId) {
  const query = subscriptionId && subscriptionId.match(/^[a-f0-9]{24}$/i) ? { _id: subscriptionId } : { subscriptionId };
  const subscription = await Subscription.findOne(query).populate({ path: "driverId", populate: { path: "userId", select: "fullName phone email" } });
  if (!subscription) throw createHttpError("Subscription not found", 404);
  return subscription;
}

async function audit(adminUser, action, subscription, description, metadata = {}) {
  await AdminAuditLog.create({ adminUserId: adminUser._id, action, targetType: "Subscription", targetId: String(subscription._id), description, metadata });
}

async function adminListSubscriptions(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.plan) filter.plan = query.plan;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.driverId) filter.driverId = query.driverId;
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }
  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate({ path: "driverId", populate: { path: "userId", select: "fullName phone email" } }),
    Subscription.countDocuments(filter)
  ]);
  let rows = subscriptions.map(function (subscription) {
    const driver = subscription.driverId || {};
    const user = driver.userId || {};
    return Object.assign(safeSubscription(subscription, driver), { driverName: user.fullName || "Driver" });
  });
  if (query.search) {
    const term = String(query.search).toLowerCase();
    rows = rows.filter(function (row) { return [row.subscriptionId, row.driverName, row.plan, row.status].join(" ").toLowerCase().includes(term); });
  }
  return { subscriptions: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function adminGetSubscription(subscriptionId) {
  const subscription = await findSubscription(subscriptionId);
  return { subscription: Object.assign(safeSubscription(subscription, subscription.driverId), { driverName: subscription.driverId.userId.fullName }) };
}

async function adminActivate(adminUser, subscriptionId) {
  const subscription = await findSubscription(subscriptionId);
  const result = await activateSubscriptionAfterPayment(subscription, null, "Manual Admin Approval");
  await audit(adminUser, "ACTIVATE_SUBSCRIPTION", subscription, "Admin manually activated subscription");
  return { subscription: safeSubscription(result.subscription, result.driver) };
}

async function adminExpire(adminUser, subscriptionId) {
  const subscription = await findSubscription(subscriptionId);
  const result = await expireSubscription(subscription);
  await audit(adminUser, "EXPIRE_SUBSCRIPTION", subscription, "Admin expired subscription");
  return { subscription: safeSubscription(result.subscription, result.driver) };
}

async function adminCancel(adminUser, subscriptionId, reason) {
  const subscription = await findSubscription(subscriptionId);
  const result = await cancelSubscription(subscription, reason);
  await audit(adminUser, "CANCEL_SUBSCRIPTION", subscription, "Admin cancelled subscription", { reason });
  return { subscription: safeSubscription(result.subscription, result.driver) };
}

async function adminChangePlan(adminUser, subscriptionId, plan) {
  if (!PLAN_CONFIG[plan]) throw createHttpError("Plan must be Basic or Pro");
  const subscription = await findSubscription(subscriptionId);
  subscription.plan = plan;
  subscription.monthlyFee = PLAN_CONFIG[plan].monthlyFee;
  await subscription.save();
  const driver = await DriverProfile.findById(subscription.driverId && subscription.driverId._id ? subscription.driverId._id : subscription.driverId);
  await applyVisibilityForSubscription(driver, subscription);
  await audit(adminUser, "CHANGE_SUBSCRIPTION_PLAN", subscription, "Admin changed subscription plan", { plan });
  return { subscription: safeSubscription(subscription, driver) };
}

module.exports = {
  PLAN_CONFIG,
  getOwnSubscription,
  selectPlan,
  activateSubscription,
  activateSubscriptionAfterPayment,
  expireSubscription,
  cancelSubscription,
  findSubscription,
  adminListSubscriptions,
  adminGetSubscription,
  adminActivate,
  adminExpire,
  adminCancel,
  adminChangePlan,
  safeSubscription
};
