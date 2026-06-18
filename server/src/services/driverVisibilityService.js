function canDriverBeVisible(driverProfile, subscription) {
  return Boolean(
    driverProfile
    && driverProfile.isApproved
    && !driverProfile.isSuspended
    && driverProfile.verificationStatus === "Verified"
    && driverProfile.profileVisibility === "Visible"
    && subscription
    && subscription.status === "Active"
  );
}

function canDriverReceiveBooking(driverProfile, subscription) {
  if (!canDriverBeVisible(driverProfile, subscription)) {
    return { allowed: false, reason: "Driver profile is not visible or subscription is not active." };
  }
  if (subscription.plan === "Basic" && Number(subscription.bookingsUsedThisMonth || 0) >= 10) {
    return { allowed: false, reason: "Basic plan monthly booking limit reached." };
  }
  return { allowed: true, reason: "Driver can receive bookings." };
}

module.exports = {
  canDriverBeVisible,
  canDriverReceiveBooking
};
