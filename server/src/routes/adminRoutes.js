const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const adminDriverApplicationRoutes = require("./adminDriverApplicationRoutes");
const adminDriverRoutes = require("./adminDriverRoutes");
const adminBookingRoutes = require("./adminBookingRoutes");
const adminReviewRoutes = require("./adminReviewRoutes");
const adminReportRoutes = require("./adminReportRoutes");
const adminSubscriptionRoutes = require("./adminSubscriptionRoutes");
const adminPaymentRoutes = require("./adminPaymentRoutes");
const adminAnalyticsRoutes = require("./adminAnalyticsRoutes");
const { successResponse } = require("../utils/apiResponse");

const router = express.Router();

// Admin routes will require admin authentication before any admin-only API is exposed.
router.use(requireAuth);
router.use(requireRole("admin"));
router.use("/driver-applications", adminDriverApplicationRoutes);
router.use("/drivers", adminDriverRoutes);
router.use("/bookings", adminBookingRoutes);
router.use("/reviews", adminReviewRoutes);
router.use("/reports", adminReportRoutes);
router.use("/subscriptions", adminSubscriptionRoutes);
router.use("/payments", adminPaymentRoutes);
router.use("/analytics", adminAnalyticsRoutes);

router.get("/", function adminPlaceholder(req, res) {
  // Admin API modules will be connected here as backend features are implemented.
  res.json(successResponse("Umusare admin API is protected and ready."));
});

module.exports = router;
