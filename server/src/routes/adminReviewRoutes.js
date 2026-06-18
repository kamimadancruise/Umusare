const express = require("express");
const adminReviewController = require("../controllers/adminReviewController");

const router = express.Router();

router.get("/", adminReviewController.listReviews);
router.get("/:reviewId", adminReviewController.getReview);
router.patch("/:reviewId/mark-reviewed", adminReviewController.markReviewed);
router.patch("/:reviewId/flag", adminReviewController.flagReview);
router.patch("/:reviewId/unflag", adminReviewController.unflagReview);

module.exports = router;
