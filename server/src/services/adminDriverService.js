const DriverProfile = require("../models/DriverProfile");
const Subscription = require("../models/Subscription");
const AdminAuditLog = require("../models/AdminAuditLog");
const { canDriverBeVisible } = require("./driverVisibilityService");

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createAuditLog(adminUser, action, targetType, targetId, description, metadata = {}) {
  await AdminAuditLog.create({
    adminUserId: adminUser._id,
    action,
    targetType,
    targetId: String(targetId),
    description,
    metadata
  });
}

function serializeAdminDriver(driverProfile, subscription) {
  const user = driverProfile.userId || {};
  return {
    id: driverProfile._id,
    publicDriverId: driverProfile.publicDriverId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    city: driverProfile.city,
    location: driverProfile.location,
    ratingAverage: driverProfile.ratingAverage,
    reviewCount: driverProfile.reviewCount,
    completedTrips: driverProfile.completedTrips,
    availability: driverProfile.availability,
    driverBadge: driverProfile.driverBadge,
    profileVisibility: driverProfile.profileVisibility,
    verificationStatus: driverProfile.verificationStatus,
    isApproved: driverProfile.isApproved,
    isSuspended: driverProfile.isSuspended,
    suspensionReason: driverProfile.suspensionReason,
    subscription: subscription ? {
      plan: subscription.plan,
      status: subscription.status,
      paymentStatus: subscription.paymentStatus,
      renewalDate: subscription.renewalDate
    } : null,
    canAppearPublicly: canDriverBeVisible(driverProfile, subscription)
  };
}

async function subscriptionMapForDrivers(driverIds) {
  const subscriptions = await Subscription.find({ driverId: { $in: driverIds } });
  return subscriptions.reduce(function (map, subscription) {
    map[String(subscription.driverId)] = subscription;
    return map;
  }, {});
}

async function listDrivers(query = {}) {
  const filter = {};
  if (query.approvalStatus === "approved") filter.isApproved = true;
  if (query.approvalStatus === "unapproved") filter.isApproved = false;
  if (query.visibility) filter.profileVisibility = query.visibility;
  if (query.availability) filter.availability = query.availability;
  if (typeof query.suspended !== "undefined") filter.isSuspended = String(query.suspended) === "true";
  if (query.city) filter.city = new RegExp(String(query.city), "i");
  let drivers = await DriverProfile.find(filter)
    .populate("userId", "fullName email phone profilePhoto")
    .sort({ updatedAt: -1 });

  if (query.search) {
    const searchTerm = String(query.search).toLowerCase();
    drivers = drivers.filter(function (driver) {
      const user = driver.userId || {};
      return [
        user.fullName,
        user.email,
        user.phone,
        driver.publicDriverId,
        driver.city,
        driver.location
      ].join(" ").toLowerCase().includes(searchTerm);
    });
  }

  const subscriptionsByDriver = await subscriptionMapForDrivers(drivers.map(function (driver) { return driver._id; }));
  return {
    drivers: drivers.map(function (driver) {
      return serializeAdminDriver(driver, subscriptionsByDriver[String(driver._id)]);
    })
  };
}

async function getDriverOrThrow(driverId) {
  const driverProfile = await DriverProfile.findById(driverId).populate("userId", "fullName email phone profilePhoto");
  if (!driverProfile) {
    throw createHttpError("Driver profile not found", 404);
  }
  return driverProfile;
}

async function updateVisibility(adminUser, driverId, profileVisibility) {
  if (!["Visible", "Hidden"].includes(profileVisibility)) {
    throw createHttpError("Invalid profile visibility");
  }
  const driverProfile = await getDriverOrThrow(driverId);
  const subscription = await Subscription.findOne({ driverId: driverProfile._id });

  if (profileVisibility === "Visible" && !canDriverBeVisible({
    isApproved: driverProfile.isApproved,
    isSuspended: driverProfile.isSuspended,
    verificationStatus: driverProfile.verificationStatus,
    profileVisibility: "Visible"
  }, subscription)) {
    throw createHttpError("Driver cannot be made visible until approved, verified, unsuspended, and subscribed.");
  }

  driverProfile.profileVisibility = profileVisibility;
  await driverProfile.save();
  await createAuditLog(adminUser, profileVisibility === "Visible" ? "SHOW_DRIVER_PROFILE" : "HIDE_DRIVER_PROFILE", "DriverProfile", driverProfile._id, "Driver profile visibility set to " + profileVisibility);
  return serializeAdminDriver(driverProfile, subscription);
}

async function suspendDriver(adminUser, driverId, suspensionReason) {
  if (!suspensionReason) {
    throw createHttpError("Suspension reason is required");
  }
  const driverProfile = await getDriverOrThrow(driverId);
  const subscription = await Subscription.findOne({ driverId: driverProfile._id });
  driverProfile.isSuspended = true;
  driverProfile.profileVisibility = "Hidden";
  driverProfile.suspensionReason = suspensionReason;
  await driverProfile.save();
  await createAuditLog(adminUser, "SUSPEND_DRIVER", "DriverProfile", driverProfile._id, "Driver suspended by admin", { suspensionReason });
  return serializeAdminDriver(driverProfile, subscription);
}

async function unsuspendDriver(adminUser, driverId) {
  const driverProfile = await getDriverOrThrow(driverId);
  const subscription = await Subscription.findOne({ driverId: driverProfile._id });
  driverProfile.isSuspended = false;
  driverProfile.suspensionReason = undefined;
  driverProfile.profileVisibility = canDriverBeVisible({
    isApproved: driverProfile.isApproved,
    isSuspended: false,
    verificationStatus: driverProfile.verificationStatus,
    profileVisibility: "Visible"
  }, subscription) ? "Visible" : "Hidden";
  await driverProfile.save();
  await createAuditLog(adminUser, "UNSUSPEND_DRIVER", "DriverProfile", driverProfile._id, "Driver unsuspended by admin");
  return serializeAdminDriver(driverProfile, subscription);
}

module.exports = {
  listDrivers,
  updateVisibility,
  suspendDriver,
  unsuspendDriver
};
