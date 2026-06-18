const express = require("express");
const adminAnalyticsController = require("../controllers/adminAnalyticsController");

const router = express.Router();

router.get("/overview", adminAnalyticsController.overview);
router.get("/bookings", adminAnalyticsController.bookings);
router.get("/drivers", adminAnalyticsController.drivers);
router.get("/applications", adminAnalyticsController.applications);
router.get("/revenue", adminAnalyticsController.revenue);
router.get("/reports", adminAnalyticsController.reports);
router.get("/recent-activity", adminAnalyticsController.recentActivity);

module.exports = router;
