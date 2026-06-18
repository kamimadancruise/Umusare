const mongoose = require("mongoose");
const DriverProfile = require("../models/DriverProfile");
const Subscription = require("../models/Subscription");
const { canDriverBeVisible, canDriverReceiveBooking } = require("./driverVisibilityService");
const { serializePublicDriver } = require("./driverService");

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(function (item) { return String(item).trim(); }).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(function (item) { return item.trim(); }).filter(Boolean);
  return [];
}

function parseExperience(value) {
  if (!value || value === "Any") return 0;
  const number = Number(String(value).match(/\d+/) && String(value).match(/\d+/)[0]);
  return Number.isFinite(number) ? number : 0;
}

function parseRating(value) {
  if (!value || value === "Any") return 0;
  const number = Number(String(value).replace("+ stars", "").replace(" stars", ""));
  return Number.isFinite(number) ? number : 0;
}

function roughlyMatchesLocation(driver, criteria) {
  const city = String(criteria.city || "").toLowerCase();
  const pickup = String(criteria.pickupLocation || "").toLowerCase();
  const driverCity = String(driver.city || "").toLowerCase();
  const driverLocation = String(driver.location || "").toLowerCase();
  return Boolean(
    city && (driverCity.includes(city) || city.includes(driverCity))
    || pickup && (
      driverCity && pickup.includes(driverCity)
      || driverLocation && pickup.includes(driverLocation)
    )
  );
}

function scoreDriver(driver, criteria) {
  let matchScore = 0;
  const reasons = [];
  const bookingType = criteria.bookingType || "Quick Book";
  const preferredLanguages = normalizeList(criteria.preferredLanguages);
  const minimumExperience = parseExperience(criteria.preferredMinExperience);
  const minimumRating = parseRating(criteria.preferredRating);

  if (bookingType === "Quick Book" && driver.availability === "Available Now") {
    matchScore += 30;
    reasons.push("Available now for Quick Book");
  }
  if (bookingType === "Plan Ahead" && driver.availability === "Available Later") {
    matchScore += 20;
    reasons.push("Scheduled availability");
  }
  if (roughlyMatchesLocation(driver, criteria)) {
    matchScore += 20;
    reasons.push("Matches city or pickup area");
  }
  if (criteria.carType && driver.vehicleTypes.includes(criteria.carType)) {
    matchScore += 20;
    reasons.push("Can drive selected vehicle type");
  }
  if (preferredLanguages.length && preferredLanguages.some(function (language) { return driver.languages.includes(language); })) {
    matchScore += 10;
    reasons.push("Matches preferred language");
  }
  if (Number(driver.ratingAverage || 0) >= Math.max(4.5, minimumRating)) {
    matchScore += 10;
    reasons.push("Strong rating");
  }
  if (Number(driver.experienceYears || 0) >= Math.max(5, minimumExperience)) {
    matchScore += 10;
    reasons.push("Experienced driver");
  }
  if (driver.driverBadge === "Pro Driver" || driver.driverBadge === "Top Driver") {
    matchScore += 5;
    reasons.push("Priority driver badge");
  }

  return { matchScore, reasons };
}

async function activeSubscriptionsByDriverId() {
  const subscriptions = await Subscription.find({ status: "Active" }).select("driverId status plan bookingsUsedThisMonth");
  return subscriptions.reduce(function (map, subscription) {
    map[String(subscription.driverId)] = subscription;
    return map;
  }, {});
}

function applyHardFilters(drivers, criteria, subscriptionsByDriver) {
  const bookingType = criteria.bookingType || "Quick Book";
  const preferredLanguages = normalizeList(criteria.preferredLanguages);
  const minimumExperience = parseExperience(criteria.preferredMinExperience);
  const minimumRating = parseRating(criteria.preferredRating);

  return drivers.filter(function (driver) {
    const subscription = subscriptionsByDriver[String(driver._id)];
    if (!canDriverBeVisible(driver, subscription)) return false;
    // TODO: Replace bookingsUsedThisMonth with a monthly counter service once subscription billing cycles are automated.
    if (!canDriverReceiveBooking(driver, subscription).allowed) return false;
    if (bookingType === "Quick Book" && driver.availability !== "Available Now") return false;
    if (bookingType === "Plan Ahead" && !["Available Now", "Available Later"].includes(driver.availability)) return false;
    if (criteria.preferredDriverGender && criteria.preferredDriverGender !== "Any" && driver.gender !== criteria.preferredDriverGender) return false;
    if (criteria.carType && criteria.carType !== "Not sure" && criteria.carType !== "Other" && !driver.vehicleTypes.includes(criteria.carType)) return false;
    if (preferredLanguages.length && !preferredLanguages.some(function (language) { return driver.languages.includes(language); })) return false;
    if (minimumExperience && Number(driver.experienceYears || 0) < minimumExperience) return false;
    if (minimumRating && Number(driver.ratingAverage || 0) < minimumRating) return false;
    return true;
  });
}

async function loadEligibleDrivers() {
  return DriverProfile.find({
    isApproved: true,
    isSuspended: false,
    verificationStatus: "Verified",
    profileVisibility: "Visible"
  }).populate("userId", "fullName firstName lastName profilePhoto city");
}

async function findMatchingDrivers(criteria = {}) {
  const subscriptionsByDriver = await activeSubscriptionsByDriverId();

  if (criteria.selectedDriverId) {
    const selectedQuery = mongoose.Types.ObjectId.isValid(criteria.selectedDriverId)
      ? { _id: criteria.selectedDriverId }
      : { publicDriverId: criteria.selectedDriverId };
    const selectedDriver = await DriverProfile.findOne(selectedQuery).populate("userId", "fullName firstName lastName profilePhoto city");
    const subscription = selectedDriver && subscriptionsByDriver[String(selectedDriver._id)];
    if (!selectedDriver || !canDriverBeVisible(selectedDriver, subscription)) {
      throw createHttpError("Selected driver is not currently available for this booking.", 409);
    }
    if (!applyHardFilters([selectedDriver], criteria, subscriptionsByDriver).length) {
      throw createHttpError("Selected driver is not currently available for this booking.", 409);
    }
    const scored = scoreDriver(selectedDriver, criteria);
    return {
      drivers: [Object.assign(serializePublicDriver(selectedDriver), { matchScore: scored.matchScore, matchReasons: scored.reasons })],
      rawDrivers: [{ driver: selectedDriver, matchScore: scored.matchScore, matchReasons: scored.reasons }],
      total: 1,
      selectedDriverPreferred: true
    };
  }

  const drivers = applyHardFilters(await loadEligibleDrivers(), criteria, subscriptionsByDriver)
    .map(function (driver) {
      const scored = scoreDriver(driver, criteria);
      return { driver, matchScore: scored.matchScore, matchReasons: scored.reasons };
    })
    .sort(function (a, b) {
      return b.matchScore - a.matchScore
        || Number(b.driver.ratingAverage || 0) - Number(a.driver.ratingAverage || 0)
        || Number(b.driver.completedTrips || 0) - Number(a.driver.completedTrips || 0);
    });

  return {
    drivers: drivers.map(function (match) {
      return Object.assign(serializePublicDriver(match.driver), {
        matchScore: match.matchScore,
        matchReasons: match.matchReasons
      });
    }),
    rawDrivers: drivers,
    total: drivers.length,
    selectedDriverPreferred: false
  };
}

module.exports = {
  findMatchingDrivers
};
