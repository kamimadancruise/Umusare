const express = require("express");
const driverController = require("../controllers/driverController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/me", requireAuth, requireRole("driver"), driverController.getOwnProfile);
router.get("/me/reviews", requireAuth, requireRole("driver"), driverController.getOwnReviews);
router.patch("/me", requireAuth, requireRole("driver"), driverController.updateOwnProfile);
router.patch("/me/availability", requireAuth, requireRole("driver"), driverController.updateOwnAvailability);
router.get("/", driverController.listPublicDrivers);
router.get("/:publicDriverId", driverController.getPublicDriver);

module.exports = router;
