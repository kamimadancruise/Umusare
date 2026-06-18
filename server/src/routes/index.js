const express = require("express");

const router = express.Router();

router.use("/health", require("./healthRoutes"));
router.use("/ready", require("./readinessRoutes"));
router.use("/auth", require("./authRoutes"));
router.use("/users", require("./userRoutes"));
router.use("/clients", require("./clientRoutes"));
router.use("/drivers", require("./driverRoutes"));
router.use("/driver-applications", require("./driverApplicationRoutes"));
router.use("/bookings", require("./bookingRoutes"));
router.use("/reviews", require("./reviewRoutes"));
router.use("/reports", require("./reportRoutes"));
router.use("/subscriptions", require("./subscriptionRoutes"));
router.use("/payments", require("./paymentRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/support", require("./supportRoutes"));
router.use("/analytics", require("./analyticsRoutes"));

module.exports = router;
