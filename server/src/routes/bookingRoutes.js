const express = require("express");
const bookingController = require("../controllers/bookingController");
const optionalAuth = require("../middleware/optionalAuth");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.post("/quick-book", optionalAuth, bookingController.createQuickBook);
router.post("/plan-ahead", optionalAuth, bookingController.createPlanAhead);
router.post("/match-drivers", optionalAuth, bookingController.matchDrivers);
router.get("/me", requireAuth, bookingController.getMyBookings);
router.get("/:bookingId", requireAuth, bookingController.getBookingDetail);
router.patch("/:bookingId/cancel", requireAuth, bookingController.cancelBooking);

router.patch("/:bookingId/accept", requireAuth, requireRole("driver"), bookingController.acceptBooking);
router.patch("/:bookingId/reject", requireAuth, requireRole("driver"), bookingController.rejectBooking);
router.patch("/:bookingId/on-the-way", requireAuth, requireRole("driver"), bookingController.markOnTheWay);
router.patch("/:bookingId/start-trip", requireAuth, requireRole("driver"), bookingController.startTrip);
router.patch("/:bookingId/complete", requireAuth, requireRole("driver"), bookingController.completeBooking);

module.exports = router;
