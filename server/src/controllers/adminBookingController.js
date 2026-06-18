const bookingService = require("../services/bookingService");
const { successResponse } = require("../utils/apiResponse");

async function listBookings(req, res, next) {
  try {
    const result = await bookingService.listAdminBookings(req.query);
    res.json(successResponse("Admin bookings loaded", result));
  } catch (error) {
    next(error);
  }
}

async function getBooking(req, res, next) {
  try {
    const booking = await bookingService.getAdminBooking(req.params.bookingId);
    res.json(successResponse("Admin booking detail loaded", { booking }));
  } catch (error) {
    next(error);
  }
}

async function assignDriver(req, res, next) {
  try {
    const booking = await bookingService.assignDriver(req.user, req.params.bookingId, req.body.driverId);
    res.json(successResponse("Driver assigned to booking", { booking }));
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const booking = await bookingService.adminUpdateStatus(req.user, req.params.bookingId, req.body.status, req.body.note);
    res.json(successResponse("Booking status updated", { booking }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listBookings,
  getBooking,
  assignDriver,
  updateStatus
};
