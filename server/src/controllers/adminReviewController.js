const reviewService = require("../services/reviewService");
const { successResponse } = require("../utils/apiResponse");

async function listReviews(req, res, next) {
  try {
    const result = await reviewService.adminListReviews(req.query);
    res.json(successResponse("Admin reviews loaded", result));
  } catch (error) {
    next(error);
  }
}

async function getReview(req, res, next) {
  try {
    const result = await reviewService.adminGetReview(req.params.reviewId);
    res.json(successResponse("Admin review detail loaded", { review: result.review }));
  } catch (error) {
    next(error);
  }
}

async function markReviewed(req, res, next) {
  try {
    const result = await reviewService.adminMarkReviewed(req.user, req.params.reviewId);
    res.json(successResponse("Review marked as reviewed", { review: result.review }));
  } catch (error) {
    next(error);
  }
}

async function flagReview(req, res, next) {
  try {
    const result = await reviewService.adminFlagReview(req.user, req.params.reviewId, req.body.flagReason);
    res.json(successResponse("Review flagged", { review: result.review }));
  } catch (error) {
    next(error);
  }
}

async function unflagReview(req, res, next) {
  try {
    const result = await reviewService.adminUnflagReview(req.user, req.params.reviewId);
    res.json(successResponse("Review unflagged", { review: result.review }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listReviews,
  getReview,
  markReviewed,
  flagReview,
  unflagReview
};
