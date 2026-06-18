const subscriptionService = require("../services/subscriptionService");
const { successResponse } = require("../utils/apiResponse");

async function getOwnSubscription(req, res, next) {
  try {
    const result = await subscriptionService.getOwnSubscription(req.user);
    res.json(successResponse(result.message, result));
  } catch (error) {
    next(error);
  }
}

async function selectPlan(req, res, next) {
  try {
    const result = await subscriptionService.selectPlan(req.user, req.body.plan);
    res.json(successResponse(result.message, result));
  } catch (error) {
    next(error);
  }
}

module.exports = { getOwnSubscription, selectPlan };
