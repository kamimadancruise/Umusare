const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/me", requireAuth, requireRole("driver"), subscriptionController.getOwnSubscription);
router.post("/select-plan", requireAuth, requireRole("driver"), subscriptionController.selectPlan);

module.exports = router;
