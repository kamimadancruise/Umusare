const express = require("express");
const adminBookingController = require("../controllers/adminBookingController");

const router = express.Router();

router.get("/", adminBookingController.listBookings);
router.get("/:bookingId", adminBookingController.getBooking);
router.patch("/:bookingId/assign-driver", adminBookingController.assignDriver);
router.patch("/:bookingId/status", adminBookingController.updateStatus);

module.exports = router;
