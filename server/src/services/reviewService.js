const Booking = require("../models/Booking");
const ClientProfile = require("../models/ClientProfile");
const DriverProfile = require("../models/DriverProfile");
const Review = require("../models/Review");
const AdminAuditLog = require("../models/AdminAuditLog");
const generateReviewId = require("../utils/reviewNumber");
const ratingService = require("./ratingService");

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function statusHistoryEntry(status, changedBy, note) {
  return { status, changedAt: new Date(), changedBy, note };
}

function publicReview(review) {
  const clientUser = review.clientId && review.clientId.userId ? review.clientId.userId : {};
  return {
    reviewId: review.reviewId,
    clientFirstName: clientUser.firstName || String(clientUser.fullName || "Client").split(" ")[0],
    rating: review.rating,
    reviewText: review.reviewText,
    createdAt: review.createdAt
  };
}

function clientReview(review) {
  const driverUser = review.driverId && review.driverId.userId ? review.driverId.userId : {};
  const booking = review.bookingId || {};
  return {
    reviewId: review.reviewId,
    bookingId: booking.bookingId,
    driverName: driverUser.fullName || "Umusare driver",
    rating: review.rating,
    reviewText: review.reviewText,
    flagged: review.flagged,
    createdAt: review.createdAt
  };
}

function adminReview(review) {
  const clientUser = review.clientId && review.clientId.userId ? review.clientId.userId : {};
  const driverUser = review.driverId && review.driverId.userId ? review.driverId.userId : {};
  const booking = review.bookingId || {};
  const driver = review.driverId || {};
  const ratingAverage = Number(driver.ratingAverage || 0);
  return {
    reviewId: review.reviewId,
    bookingId: booking.bookingId,
    clientFirstName: clientUser.firstName || String(clientUser.fullName || "Client").split(" ")[0],
    driverName: driverUser.fullName || "Umusare driver",
    driverId: driver._id,
    rating: review.rating,
    reviewText: review.reviewText,
    reviewSummary: review.reviewText ? review.reviewText.slice(0, 120) : "",
    flagged: review.flagged,
    flagReason: review.flagReason,
    adminReviewed: review.adminReviewed,
    createdAt: review.createdAt,
    driverRatingAverage: ratingAverage,
    lowRatingWarning: ratingAverage > 0 && ratingAverage < 3.5
  };
}

function validateReviewInput(input) {
  if (!input.bookingId) throw createHttpError("Booking ID is required");
  const rating = Number(input.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw createHttpError("Rating must be between 1 and 5");
  if (!input.reviewText || String(input.reviewText).trim().length < 2) throw createHttpError("Review text is required");
  return { rating, reviewText: String(input.reviewText).trim() };
}

async function submitReview(user, input) {
  const validated = validateReviewInput(input);
  const booking = await Booking.findOne({ bookingId: input.bookingId }).populate("driverId");
  if (!booking) throw createHttpError("Booking not found", 404);
  if (!booking.clientUserId || String(booking.clientUserId) !== String(user._id)) {
    throw createHttpError("Not authorized to review this booking", 403);
  }
  const clientProfile = await ClientProfile.findOne({ userId: user._id });
  if (!clientProfile) throw createHttpError("Client profile not found", 404);
  const existing = await Review.findOne({ bookingId: booking._id, clientId: clientProfile._id });
  if (existing) throw createHttpError("This booking has already been reviewed", 409);
  if (booking.status !== "Completed") throw createHttpError("Only completed bookings can be reviewed", 409);
  if (!booking.driverId) throw createHttpError("Booking does not have an assigned driver", 409);

  const flagged = validated.rating <= 2 || Boolean(input.safetyConcern);
  const flagReason = input.safetyConcern ? "Safety concern" : validated.rating <= 2 ? "Low rating" : undefined;
  const review = await Review.create({
    reviewId: await generateReviewId(),
    bookingId: booking._id,
    clientId: clientProfile._id,
    driverId: booking.driverId._id,
    rating: validated.rating,
    reviewText: validated.reviewText,
    flagged,
    flagReason
  });

  booking.status = "Reviewed";
  booking.lastUpdated = new Date();
  booking.statusHistory.push(statusHistoryEntry("Reviewed", user._id, "Review submitted"));
  await booking.save();

  const ratingSummary = await ratingService.recalculateDriverRating(booking.driverId._id);
  return {
    review,
    ratingSummary
  };
}

async function listPublicDriverReviews(publicDriverId) {
  const driver = await DriverProfile.findOne({ publicDriverId }).select("_id");
  if (!driver) throw createHttpError("Driver profile not available.", 404);
  const reviews = await Review.find({ driverId: driver._id })
    .populate({ path: "clientId", select: "userId", populate: { path: "userId", select: "firstName fullName" } })
    .sort({ createdAt: -1 })
    .limit(20);
  return { reviews: reviews.map(publicReview) };
}

async function listMyReviews(user) {
  const clientProfile = await ClientProfile.findOne({ userId: user._id });
  if (!clientProfile) return { reviews: [] };
  const reviews = await Review.find({ clientId: clientProfile._id })
    .populate("bookingId", "bookingId")
    .populate({ path: "driverId", select: "userId", populate: { path: "userId", select: "fullName" } })
    .sort({ createdAt: -1 });
  return { reviews: reviews.map(clientReview) };
}

async function listDriverReviews(user) {
  const driver = await DriverProfile.findOne({ userId: user._id });
  if (!driver) throw createHttpError("Your driver profile is not approved yet.", 404);
  const reviews = await Review.find({ driverId: driver._id })
    .populate("bookingId", "bookingId")
    .populate({ path: "clientId", select: "userId", populate: { path: "userId", select: "firstName fullName" } })
    .sort({ createdAt: -1 });
  const ratingSummary = await ratingService.getDriverRatingSummary(driver._id);
  return {
    ratingSummary,
    reviews: reviews.map(publicReview)
  };
}

async function adminListReviews(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const filter = {};
  if (query.rating) filter.rating = Number(query.rating);
  if (typeof query.flagged !== "undefined") filter.flagged = String(query.flagged) === "true";
  if (query.driverId) filter.driverId = query.driverId;
  if (query.clientId) filter.clientId = query.clientId;
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }
  if (query.search) filter.reviewText = new RegExp(String(query.search), "i");
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ flagged: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("bookingId", "bookingId")
      .populate({ path: "clientId", select: "userId", populate: { path: "userId", select: "firstName fullName" } })
      .populate({ path: "driverId", select: "userId ratingAverage", populate: { path: "userId", select: "fullName" } }),
    Review.countDocuments(filter)
  ]);
  return {
    reviews: reviews.map(adminReview),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function adminGetReview(reviewId) {
  const review = await Review.findOne({ reviewId })
    .populate("bookingId", "bookingId pickupLocation destination status")
    .populate({ path: "clientId", select: "userId", populate: { path: "userId", select: "firstName fullName" } })
    .populate({ path: "driverId", select: "userId ratingAverage reviewCount completedTrips", populate: { path: "userId", select: "fullName" } });
  if (!review) throw createHttpError("Review not found", 404);
  return { review: adminReview(review), raw: review };
}

async function audit(adminUser, action, review, description, metadata = {}) {
  await AdminAuditLog.create({
    adminUserId: adminUser._id,
    action,
    targetType: "Review",
    targetId: String(review._id),
    description,
    metadata
  });
}

async function adminMarkReviewed(adminUser, reviewId) {
  const review = await Review.findOne({ reviewId });
  if (!review) throw createHttpError("Review not found", 404);
  review.adminReviewed = true;
  review.adminReviewedBy = adminUser._id;
  review.adminReviewedAt = new Date();
  await review.save();
  await audit(adminUser, "MARK_REVIEW_REVIEWED", review, "Admin marked review as reviewed");
  return adminGetReview(reviewId);
}

async function adminFlagReview(adminUser, reviewId, flagReason) {
  if (!flagReason) throw createHttpError("Flag reason is required");
  const review = await Review.findOne({ reviewId });
  if (!review) throw createHttpError("Review not found", 404);
  review.flagged = true;
  review.flagReason = flagReason;
  await review.save();
  await audit(adminUser, "FLAG_REVIEW", review, "Admin flagged review", { flagReason });
  return adminGetReview(reviewId);
}

async function adminUnflagReview(adminUser, reviewId) {
  const review = await Review.findOne({ reviewId });
  if (!review) throw createHttpError("Review not found", 404);
  review.flagged = false;
  review.flagReason = undefined;
  await review.save();
  await audit(adminUser, "UNFLAG_REVIEW", review, "Admin removed review flag");
  return adminGetReview(reviewId);
}

module.exports = {
  submitReview,
  listPublicDriverReviews,
  listMyReviews,
  listDriverReviews,
  adminListReviews,
  adminGetReview,
  adminMarkReviewed,
  adminFlagReview,
  adminUnflagReview
};
