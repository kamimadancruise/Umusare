const subscriptionService = require("../services/subscriptionService");
const { successResponse } = require("../utils/apiResponse");

async function listSubscriptions(req, res, next) {
  try {
    const result = await subscriptionService.adminListSubscriptions(req.query);
    res.json(successResponse("Admin subscriptions loaded", result));
  } catch (error) { next(error); }
}

async function getSubscription(req, res, next) {
  try {
    const result = await subscriptionService.adminGetSubscription(req.params.subscriptionId);
    res.json(successResponse("Admin subscription loaded", result));
  } catch (error) { next(error); }
}

async function activate(req, res, next) {
  try {
    const result = await subscriptionService.adminActivate(req.user, req.params.subscriptionId);
    res.json(successResponse("Subscription activated", result));
  } catch (error) { next(error); }
}

async function expire(req, res, next) {
  try {
    const result = await subscriptionService.adminExpire(req.user, req.params.subscriptionId);
    res.json(successResponse("Subscription expired", result));
  } catch (error) { next(error); }
}

async function cancel(req, res, next) {
  try {
    const result = await subscriptionService.adminCancel(req.user, req.params.subscriptionId, req.body.reason);
    res.json(successResponse("Subscription cancelled", result));
  } catch (error) { next(error); }
}

async function changePlan(req, res, next) {
  try {
    const result = await subscriptionService.adminChangePlan(req.user, req.params.subscriptionId, req.body.plan);
    res.json(successResponse("Subscription plan changed", result));
  } catch (error) { next(error); }
}

module.exports = { listSubscriptions, getSubscription, activate, expire, cancel, changePlan };
