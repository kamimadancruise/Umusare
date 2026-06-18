const bookingService = require("../services/bookingService");
const { successResponse } = require("../utils/apiResponse");

async function createQuickBook(req, res, next) {
  try {
    const result = await bookingService.createQuickBook(req.body, req.user);
    res.status(201).json(successResponse(result.message || "Quick Book request created", result));
  } catch (error) {
    next(error);
  }
}

async function createPlanAhead(req, res, next) {
  try {
    const result = await bookingService.createPlanAhead(req.body, req.user);
    res.status(201).json(successResponse(result.message || "Plan Ahead booking created", result));
  } catch (error) {
    next(error);
  }
}

async function matchDrivers(req, res, next) {
  try {
    const result = await bookingService.matchDrivers(req.body);
    res.json(successResponse("Matching drivers found", result));
  } catch (error) {
    next(error);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const bookings = await bookingService.getMyBookings(req.user);
    res.json(successResponse("Bookings loaded", { bookings }));
  } catch (error) {
    next(error);
  }
}

async function getBookingDetail(req, res, next) {
  try {
    const booking = await bookingService.getBookingDetail(req.user, req.params.bookingId);
    res.json(successResponse("Booking detail loaded", { booking }));
  } catch (error) {
    next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(req.user, req.params.bookingId, req.body.cancellationReason);
    res.json(successResponse("Booking cancelled", { booking }));
  } catch (error) {
    next(error);
  }
}

async function acceptBooking(req, res, next) {
  try {
    const booking = await bookingService.driverAction(req.user, req.params.bookingId, "accept", req.body.note);
    res.json(successResponse("Booking accepted", { booking }));
  } catch (error) {
    next(error);
  }
}

async function rejectBooking(req, res, next) {
  try {
    const booking = await bookingService.driverAction(req.user, req.params.bookingId, "reject", req.body.note);
    res.json(successResponse("Booking rejected", { booking }));
  } catch (error) {
    next(error);
  }
}

async function markOnTheWay(req, res, next) {
  try {
    const booking = await bookingService.driverAction(req.user, req.params.bookingId, "on-the-way", req.body.note);
    res.json(successResponse("Booking marked driver on the way", { booking }));
  } catch (error) {
    next(error);
  }
}

async function startTrip(req, res, next) {
  try {
    const booking = await bookingService.driverAction(req.user, req.params.bookingId, "start-trip", req.body.note);
    res.json(successResponse("Booking marked trip started", { booking }));
  } catch (error) {
    next(error);
  }
}

async function completeBooking(req, res, next) {
  try {
    const booking = await bookingService.driverAction(req.user, req.params.bookingId, "complete", req.body.note);
    res.json(successResponse("Booking completed", { booking }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  matchDrivers,
  createQuickBook,
  createPlanAhead,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  acceptBooking,
  rejectBooking,
  markOnTheWay,
  startTrip,
  completeBooking
};
