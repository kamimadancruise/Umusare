const express = require("express");
const reviewController = require("../controllers/reviewController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.post("/", requireAuth, requireRole("client"), reviewController.submitReview);
router.get("/me", requireAuth, requireRole("client"), reviewController.listMyReviews);
router.get("/driver/:publicDriverId", reviewController.listDriverReviews);

module.exports = router;
