const reviewService = require("../services/reviewService");
const { successResponse } = require("../utils/apiResponse");

async function submitReview(req, res, next) {
  try {
    const result = await reviewService.submitReview(req.user, req.body);
    res.status(201).json(successResponse("Review submitted successfully", result));
  } catch (error) {
    next(error);
  }
}

async function listDriverReviews(req, res, next) {
  try {
    const result = await reviewService.listPublicDriverReviews(req.params.publicDriverId);
    res.json(successResponse("Driver reviews loaded", result));
  } catch (error) {
    next(error);
  }
}

async function listMyReviews(req, res, next) {
  try {
    const result = await reviewService.listMyReviews(req.user);
    res.json(successResponse("Client reviews loaded", result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitReview,
  listDriverReviews,
  listMyReviews
};
