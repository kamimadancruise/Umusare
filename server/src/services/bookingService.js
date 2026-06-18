const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const ClientProfile = require("../models/ClientProfile");
const DriverProfile = require("../models/DriverProfile");
const Subscription = require("../models/Subscription");
const AdminAuditLog = require("../models/AdminAuditLog");
const IncidentReport = require("../models/IncidentReport");
const generateBookingId = require("../utils/bookingNumber");
const { BOOKING_STATUSES, canTransitionBookingStatus } = require("../utils/bookingStatus");
const { canDriverBeVisible, canDriverReceiveBooking } = require("./driverVisibilityService");
const driverMatchingService = require("./driverMatchingService");
const contactService = require("./contactService");

const VALID_NEEDED_TIME = ["ASAP", "In 15 minutes", "In 30 minutes", "In 1 hour", "Custom"];
const VALID_CAR_TYPES = ["Automatic", "Manual", "SUV", "Pickup", "Luxury car", "Not sure", "Other"];
const VALID_BOOKING_TYPES = ["Quick Book", "Plan Ahead"];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeCarType(value) {
  const map = {
    automatic: "Automatic",
    manual: "Manual",
    suv: "SUV",
    pickup: "Pickup",
    "luxury-car": "Luxury car",
    other: "Other",
    "not-sure": "Not sure"
  };
  return map[value] || value;
}

function normalizeNeededTime(value) {
  return value === "Choose time" ? "Custom" : value;
}

function normalizeCustomTime(value) {
  if (!value) return undefined;
  if (/^\d{2}:\d{2}$/.test(String(value))) {
    const [hours, minutes] = String(value).split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  return value;
}

function normalizePreferredExperience(value) {
  if (value === undefined || value === null || value === "" || value === "any") return "Any";
  if (["Any", "2+ years", "5+ years", "10+ years"].includes(value)) return value;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(numeric)) return "Any";
  if (numeric >= 10) return "10+ years";
  if (numeric >= 5) return "5+ years";
  if (numeric >= 2) return "2+ years";
  return "Any";
}

function normalizePreferredRating(value) {
  if (value === undefined || value === null || value === "" || value === "any") return "Any";
  if (["Any", "4+ stars", "4.5+ stars"].includes(value)) return value;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(numeric)) return "Any";
  if (numeric >= 4.5) return "4.5+ stars";
  if (numeric >= 4) return "4+ stars";
  return "Any";
}

function normalizePreferredGender(value) {
  const map = { any: "Any", male: "Male", female: "Female" };
  return map[String(value || "Any").toLowerCase()] || value || "Any";
}

function safeNameFromInput(input) {
  return input.clientName || input.firstName || input.fullName || "Guest client";
}

async function ensureClientProfile(user) {
  if (!user || user.role !== "client") return null;
  let clientProfile = await ClientProfile.findOne({ userId: user._id });
  if (!clientProfile) {
    clientProfile = await ClientProfile.create({ userId: user._id });
  }
  return clientProfile;
}

async function getEligibleDriver(selectedDriverId) {
  if (!selectedDriverId) return null;
  const query = mongoose.Types.ObjectId.isValid(selectedDriverId)
    ? { _id: selectedDriverId }
    : { publicDriverId: selectedDriverId };
  const driverProfile = await DriverProfile.findOne(query).populate("userId", "fullName phone profilePhoto");
  if (!driverProfile) throw createHttpError("Selected driver is not available.", 404);
  const subscription = await Subscription.findOne({ driverId: driverProfile._id });
  if (!canDriverBeVisible(driverProfile, subscription)) {
    throw createHttpError("Selected driver is not available for booking.", 409);
  }
  const bookingEligibility = canDriverReceiveBooking(driverProfile, subscription);
  if (!bookingEligibility.allowed) {
    throw createHttpError(bookingEligibility.reason, 409);
  }
  return driverProfile;
}

function validateQuickBook(input) {
  const neededTime = normalizeNeededTime(input.neededTime);
  const carType = normalizeCarType(input.carType);
  if (!safeNameFromInput(input)) throw createHttpError("Client name is required");
  if (!input.phone) throw createHttpError("Phone number is required");
  if (!input.pickupLocation) throw createHttpError("Pickup location is required");
  if (!input.destination) throw createHttpError("Destination is required");
  if (!VALID_NEEDED_TIME.includes(neededTime)) throw createHttpError("Invalid needed time");
  if (neededTime === "Custom" && !input.customTime) throw createHttpError("Custom time is required");
  if (!VALID_CAR_TYPES.includes(carType)) throw createHttpError("Invalid car type");
  return { neededTime, carType };
}

function validatePlanAhead(input) {
  const carType = normalizeCarType(input.carType);
  if (!safeNameFromInput(input)) throw createHttpError("Client name is required");
  if (!input.phone) throw createHttpError("Phone number is required");
  if (!input.pickupLocation) throw createHttpError("Pickup location is required");
  if (!input.destination) throw createHttpError("Destination is required");
  if (!input.dateTime) throw createHttpError("Date and time is required");
  if (!VALID_CAR_TYPES.includes(carType)) throw createHttpError("Invalid car type");
  return { carType };
}

function statusHistoryEntry(status, changedBy, note) {
  return { status, changedAt: new Date(), changedBy, note };
}

function serializeBooking(booking, viewerRole) {
  const driverProfile = booking.driverId || {};
  const driverUser = driverProfile.userId || {};
  const clientUser = booking.clientUserId || {};
  const clientName = clientUser.fullName || booking.guestClientName || "Guest client";
  const driverName = driverUser.fullName || "Pending assignment";
  const canSeeDriverPhone = viewerRole === "admin" || (["Accepted", "Driver on the way", "Trip started", "Completed", "Reported", "Reviewed"].includes(booking.status));
  const canSeeClientPhone = viewerRole === "admin" || (viewerRole === "driver" && booking.driverUserId && ["Accepted", "Driver on the way", "Trip started", "Completed", "Reported", "Reviewed"].includes(booking.status));

  return {
    id: booking._id,
    bookingId: booking.bookingId,
    bookingType: booking.bookingType,
    clientName,
    clientPhone: canSeeClientPhone ? (clientUser.phone || booking.guestClientPhone) : undefined,
    driverName,
    driverPhone: canSeeDriverPhone ? driverUser.phone : undefined,
    driverPublicId: driverProfile.publicDriverId,
    driverAvailability: driverProfile.availability,
    pickupLocation: booking.pickupLocation,
    destination: booking.destination,
    dateTime: booking.dateTime,
    neededTime: booking.neededTime,
    customTime: booking.customTime,
    carType: booking.carType,
    clientNotes: booking.clientNotes,
    driverNotes: booking.driverNotes,
    status: booking.status,
    contactActions: contactService.buildBookingContactActions(booking, viewerRole),
    requestLabel: viewerRole === "driver" && !booking.driverId && booking.candidateDrivers && booking.candidateDrivers.length ? "Booking request" : undefined,
    statusHistory: booking.statusHistory,
    acceptedAt: booking.acceptedAt,
    startedAt: booking.startedAt,
    completedAt: booking.completedAt,
    cancelledAt: booking.cancelledAt,
    cancellationReason: booking.cancellationReason,
    lastUpdated: booking.lastUpdated,
    returnTripNeeded: booking.returnTripNeeded,
    returnTime: booking.returnTime,
    additionalStops: booking.additionalStops,
    tripType: booking.tripType,
    preferredDriverGender: booking.preferredDriverGender,
    preferredMinExperience: booking.preferredMinExperience,
    preferredLanguages: booking.preferredLanguages,
    preferredRating: booking.preferredRating,
    candidateDrivers: viewerRole === "admin" ? (booking.candidateDrivers || []).map(function (candidate) {
      const candidateProfile = candidate.driverId || {};
      const candidateUser = candidateProfile.userId || {};
      return {
        publicDriverId: candidateProfile.publicDriverId,
        fullName: candidateUser.fullName || "Suggested driver",
        ratingAverage: candidateProfile.ratingAverage,
        availability: candidateProfile.availability,
        vehicleTypes: candidateProfile.vehicleTypes,
        driverBadge: candidateProfile.driverBadge,
        matchScore: candidate.matchScore,
        matchReasons: candidate.matchReasons
      };
    }) : undefined
  };
}

function buildMatchingCriteria(input, bookingType, normalized) {
  return {
    bookingType,
    city: input.city || input.location,
    pickupLocation: input.pickupLocation,
    availability: bookingType === "Quick Book" ? "Available Now" : undefined,
    carType: normalized.carType,
    neededTime: normalized.neededTime,
    dateTime: input.dateTime,
    preferredDriverGender: input.preferredDriverGender,
    preferredLanguages: input.preferredLanguages,
    preferredMinExperience: input.preferredMinExperience,
    preferredRating: input.preferredRating,
    selectedDriverId: input.selectedDriverId
  };
}

async function matchDrivers(input) {
  if (!VALID_BOOKING_TYPES.includes(input.bookingType)) {
    throw createHttpError("Booking type must be Quick Book or Plan Ahead");
  }
  const carType = normalizeCarType(input.carType);
  if (carType && !VALID_CAR_TYPES.includes(carType)) throw createHttpError("Invalid car type");
  if (input.preferredRating && Number.isNaN(Number(String(input.preferredRating).replace(/[^0-9.]/g, "")))) {
    throw createHttpError("Preferred rating must be numeric");
  }
  if (input.preferredMinExperience && Number.isNaN(Number(String(input.preferredMinExperience).replace(/[^0-9.]/g, "")))) {
    throw createHttpError("Preferred minimum experience must be numeric");
  }
  const matches = await driverMatchingService.findMatchingDrivers(buildMatchingCriteria(input, input.bookingType, {
    carType,
    neededTime: normalizeNeededTime(input.neededTime)
  }));
  return {
    drivers: matches.drivers,
    total: matches.total
  };
}

function candidateDriversFromMatches(matches, limit) {
  return matches.rawDrivers.slice(0, limit).map(function (match) {
    return {
      driverId: match.driver._id,
      matchScore: match.matchScore,
      matchReasons: match.matchReasons
    };
  });
}

async function createBooking(input, user, bookingType) {
  const isQuickBook = bookingType === "Quick Book";
  const validation = isQuickBook ? validateQuickBook(input) : validatePlanAhead(input);
  const clientProfile = await ensureClientProfile(user);
  const matches = await driverMatchingService.findMatchingDrivers(buildMatchingCriteria(input, bookingType, validation));
  const selectedMatch = input.selectedDriverId && matches.rawDrivers[0];
  const driverProfile = selectedMatch ? selectedMatch.driver : null;
  const now = new Date();
  const booking = await Booking.create({
    bookingId: await generateBookingId(),
    bookingType,
    clientId: clientProfile && clientProfile._id,
    clientUserId: user && user.role === "client" ? user._id : undefined,
    guestClientName: safeNameFromInput(input),
    guestClientPhone: input.phone,
    guestClientEmail: input.email,
    driverId: driverProfile && driverProfile._id,
    driverUserId: driverProfile && driverProfile.userId && driverProfile.userId._id,
    candidateDrivers: driverProfile ? [] : candidateDriversFromMatches(matches, isQuickBook ? 3 : 5),
    pickupLocation: input.pickupLocation,
    destination: input.destination,
    dateTime: isQuickBook ? now : input.dateTime,
    neededTime: isQuickBook ? validation.neededTime : "Custom",
    customTime: normalizeCustomTime(input.customTime),
    carType: validation.carType,
    clientNotes: input.clientNotes || input.specialInstructions,
    status: "Pending",
    statusHistory: [statusHistoryEntry("Pending", user && user._id, bookingType + " request created")],
    lastUpdated: now,
    returnTripNeeded: Boolean(input.returnTripNeeded),
    returnTime: normalizeCustomTime(input.returnTime),
    additionalStops: Array.isArray(input.additionalStops) ? input.additionalStops : String(input.additionalStops || "").split(",").map(function (stop) { return stop.trim(); }).filter(Boolean),
    tripType: input.tripType,
    preferredDriverGender: normalizePreferredGender(input.preferredDriverGender),
    preferredMinExperience: normalizePreferredExperience(input.preferredMinExperience),
    preferredLanguages: Array.isArray(input.preferredLanguages) ? input.preferredLanguages : String(input.preferredLanguages || "").split(",").map(function (language) { return language.trim(); }).filter(Boolean),
    preferredRating: normalizePreferredRating(input.preferredRating)
  });

  if (clientProfile) {
    clientProfile.totalBookings += 1;
    await clientProfile.save();
  }

  const populated = await findBookingById(booking.bookingId);
  return {
    booking: serializeBooking(populated, user ? user.role : "guest"),
    suggestedDrivers: matches.drivers.slice(0, isQuickBook ? 3 : 5),
    message: matches.drivers.length
      ? "Matching drivers found"
      : "Your request has been created. Umusare will look for an available driver."
  };
}

async function createQuickBook(input, user) {
  return createBooking(input, user, "Quick Book");
}

async function createPlanAhead(input, user) {
  return createBooking(input, user, "Plan Ahead");
}

async function findBookingById(bookingId) {
  const booking = await Booking.findOne({ bookingId })
    .populate("clientUserId", "fullName firstName phone email")
    .populate({
      path: "driverId",
      select: "publicDriverId availability driverBadge userId",
      populate: { path: "userId", select: "fullName firstName phone profilePhoto" }
    })
    .populate({
      path: "candidateDrivers.driverId",
      select: "publicDriverId availability driverBadge ratingAverage completedTrips vehicleTypes userId",
      populate: { path: "userId", select: "fullName firstName profilePhoto" }
    });
  if (!booking) throw createHttpError("Booking not found", 404);
  return booking;
}

function canUserAccessBooking(user, booking) {
  if (user.role === "admin") return true;
  if (user.role === "client" && booking.clientUserId && String(booking.clientUserId._id || booking.clientUserId) === String(user._id)) return true;
  if (user.role === "driver" && booking.driverUserId && String(booking.driverUserId) === String(user._id)) return true;
  return false;
}

async function getMyBookings(user) {
  const driverProfile = user.role === "driver" ? await DriverProfile.findOne({ userId: user._id }).select("_id") : null;
  const filter = user.role === "client"
    ? { clientUserId: user._id }
    : user.role === "driver"
      ? { $or: [{ driverUserId: user._id }, { "candidateDrivers.driverId": driverProfile && driverProfile._id, status: "Pending" }] }
      : {};
  if (!Object.keys(filter).length) throw createHttpError("Bookings are only available for clients and drivers.", 403);
  const bookings = await Booking.find(filter).sort({ dateTime: -1 })
    .populate("clientUserId", "fullName firstName phone email")
    .populate({ path: "driverId", select: "publicDriverId availability driverBadge userId", populate: { path: "userId", select: "fullName firstName phone profilePhoto" } })
    .populate({ path: "candidateDrivers.driverId", select: "publicDriverId availability driverBadge ratingAverage completedTrips vehicleTypes userId", populate: { path: "userId", select: "fullName firstName profilePhoto" } });
  return bookings.map(function (booking) { return serializeBooking(booking, user.role); });
}

async function getBookingDetail(user, bookingId) {
  const booking = await findBookingById(bookingId);
  if (!canUserAccessBooking(user, booking)) throw createHttpError("Not authorized to view this booking", 403);
  return serializeBooking(booking, user.role);
}

async function transitionBooking(booking, nextStatus, user, note, adminOverride = false) {
  if (!adminOverride && !canTransitionBookingStatus(booking.status, nextStatus)) {
    throw createHttpError("Invalid booking status transition");
  }
  booking.status = nextStatus;
  booking.lastUpdated = new Date();
  if (nextStatus === "Accepted") booking.acceptedAt = new Date();
  if (nextStatus === "Trip started") booking.startedAt = new Date();
  if (nextStatus === "Completed") booking.completedAt = new Date();
  if (nextStatus === "Cancelled") booking.cancelledAt = new Date();
  booking.statusHistory.push(statusHistoryEntry(nextStatus, user && user._id, note));
  await booking.save();
  return findBookingById(booking.bookingId);
}

async function cancelBooking(user, bookingId, cancellationReason) {
  if (!cancellationReason) throw createHttpError("Cancellation reason is required");
  const booking = await findBookingById(bookingId);
  if (!canUserAccessBooking(user, booking)) throw createHttpError("Not authorized to cancel this booking", 403);
  if (["Completed", "Reviewed"].includes(booking.status)) throw createHttpError("Completed or reviewed bookings cannot be cancelled", 409);
  booking.cancellationReason = cancellationReason;
  const updated = await transitionBooking(booking, "Cancelled", user, cancellationReason);
  return serializeBooking(updated, user.role);
}

async function getDriverProfileForAction(user) {
  const driverProfile = await DriverProfile.findOne({ userId: user._id });
  if (!driverProfile || !driverProfile.isApproved || driverProfile.isSuspended) {
    throw createHttpError("Driver is not eligible to update this booking.", 403);
  }
  return driverProfile;
}

async function driverAction(user, bookingId, action, note) {
  const driverProfile = await getDriverProfileForAction(user);
  const subscription = await Subscription.findOne({ driverId: driverProfile._id });
  const eligibility = canDriverReceiveBooking(driverProfile, subscription);
  if (!eligibility.allowed) throw createHttpError(eligibility.reason, 409);
  const booking = await findBookingById(bookingId);
  const assignedToDriver = booking.driverUserId && String(booking.driverUserId) === String(user._id);
  const isCandidate = (booking.candidateDrivers || []).some(function (candidate) {
    return String(candidate.driverId._id || candidate.driverId) === String(driverProfile._id);
  });
  if (!assignedToDriver && action !== "accept") throw createHttpError("Only the assigned driver can update this booking.", 403);
  if (action === "accept") {
    if (booking.status !== "Pending") throw createHttpError("This booking has already been accepted.", 409);
    if (booking.driverUserId && !assignedToDriver) throw createHttpError("This booking is assigned to another driver.", 403);
    if (!assignedToDriver && booking.candidateDrivers.length && !isCandidate) throw createHttpError("Only a candidate driver can accept this booking.", 403);
    booking.driverId = driverProfile._id;
    booking.driverUserId = user._id;
    booking.candidateDrivers = [];
    const accepted = await transitionBooking(booking, "Accepted", user, "Driver accepted booking");
    if (subscription) {
      // TODO: Reset bookingsUsedThisMonth automatically when real billing periods are implemented.
      subscription.bookingsUsedThisMonth = Number(subscription.bookingsUsedThisMonth || 0) + 1;
      await subscription.save();
    }
    return serializeBooking(accepted, "driver");
  }
  if (action === "reject") {
    if (booking.status !== "Pending") throw createHttpError("Only pending bookings can be rejected", 409);
    booking.driverNotes = note || "Driver rejected booking";
    booking.statusHistory.push(statusHistoryEntry("Pending", user._id, note || "Driver rejected booking"));
    if (assignedToDriver) {
      booking.driverId = undefined;
      booking.driverUserId = undefined;
    }
    await booking.save();
    return serializeBooking(await findBookingById(booking.bookingId), "driver");
  }
  const transitions = {
    "on-the-way": ["Driver on the way", "Driver marked on the way"],
    "start-trip": ["Trip started", "Driver started trip"],
    complete: ["Completed", "Driver completed trip"]
  };
  const transition = transitions[action];
  if (!transition) throw createHttpError("Invalid driver booking action");
  const updated = await transitionBooking(booking, transition[0], user, transition[1]);
  if (transition[0] === "Completed") {
    driverProfile.completedTrips += 1;
    await driverProfile.save();
  }
  return serializeBooking(updated, "driver");
}

async function createAuditLog(adminUser, action, targetId, description, metadata = {}) {
  await AdminAuditLog.create({
    adminUserId: adminUser._id,
    action,
    targetType: "Booking",
    targetId: String(targetId),
    description,
    metadata
  });
}

async function listAdminBookings(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.bookingType) filter.bookingType = query.bookingType;
  if (query.driverId) filter.driverId = query.driverId;
  if (query.clientId) filter.clientId = query.clientId;
  if (query.dateFrom || query.dateTo) {
    filter.dateTime = {};
    if (query.dateFrom) filter.dateTime.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.dateTime.$lte = new Date(query.dateTo);
  }
  if (query.search) {
    const search = new RegExp(String(query.search), "i");
    filter.$or = [{ bookingId: search }, { pickupLocation: search }, { destination: search }, { guestClientName: search }, { guestClientPhone: search }];
  }
  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ dateTime: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("clientUserId", "fullName firstName phone email")
      .populate({ path: "driverId", select: "publicDriverId availability driverBadge userId", populate: { path: "userId", select: "fullName firstName phone profilePhoto" } })
      .populate({ path: "candidateDrivers.driverId", select: "publicDriverId availability driverBadge ratingAverage completedTrips vehicleTypes userId", populate: { path: "userId", select: "fullName firstName profilePhoto" } }),
    Booking.countDocuments(filter)
  ]);
  return {
    bookings: bookings.map(function (booking) { return serializeBooking(booking, "admin"); }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function getAdminBooking(bookingId) {
  const booking = await findBookingById(bookingId);
  const serialized = serializeBooking(booking, "admin");
  const reports = await IncidentReport.find({ bookingId: booking._id }).sort({ createdAt: -1 });
  serialized.incidentReports = reports.map(function (report) {
    return {
      reportId: report.reportId,
      reportType: report.reportType,
      urgency: report.urgency,
      status: report.status,
      createdAt: report.createdAt
    };
  });
  return serialized;
}

async function assignDriver(adminUser, bookingId, driverId) {
  if (!driverId) throw createHttpError("Driver ID is required");
  const booking = await findBookingById(bookingId);
  const driver = await getEligibleDriver(driverId);
  booking.driverId = driver._id;
  booking.driverUserId = driver.userId._id || driver.userId;
  booking.statusHistory.push(statusHistoryEntry(booking.status, adminUser._id, "Admin assigned driver"));
  booking.lastUpdated = new Date();
  await booking.save();
  await createAuditLog(adminUser, "ASSIGN_BOOKING_DRIVER", booking._id, "Admin assigned driver", { driverId: driver._id });
  return serializeBooking(await findBookingById(booking.bookingId), "admin");
}

async function adminUpdateStatus(adminUser, bookingId, status, note) {
  if (!BOOKING_STATUSES.includes(status) || status === "Reviewed") throw createHttpError("Invalid admin booking status");
  if (!note) throw createHttpError("Admin status note is required");
  const booking = await findBookingById(bookingId);
  const updated = await transitionBooking(booking, status, adminUser, note, true);
  await createAuditLog(adminUser, "UPDATE_BOOKING_STATUS", booking._id, "Admin updated booking status", { status, note });
  return serializeBooking(updated, "admin");
}

module.exports = {
  matchDrivers,
  createQuickBook,
  createPlanAhead,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  driverAction,
  listAdminBookings,
  getAdminBooking,
  assignDriver,
  adminUpdateStatus
};
