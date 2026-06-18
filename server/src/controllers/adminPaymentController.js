const paymentService = require("../services/paymentService");
const { successResponse } = require("../utils/apiResponse");

async function listPayments(req, res, next) {
  try {
    const result = await paymentService.adminListPayments(req.query);
    res.json(successResponse("Admin payments loaded", result));
  } catch (error) { next(error); }
}

async function getPayment(req, res, next) {
  try {
    const result = await paymentService.adminGetPayment(req.params.paymentId);
    res.json(successResponse("Admin payment loaded", result));
  } catch (error) { next(error); }
}

async function markSuccess(req, res, next) {
  try {
    const result = await paymentService.adminMarkSuccess(req.user, req.params.paymentId);
    res.json(successResponse("Dummy payment marked successful", result));
  } catch (error) { next(error); }
}

async function markFailed(req, res, next) {
  try {
    const result = await paymentService.adminMarkFailed(req.user, req.params.paymentId);
    res.json(successResponse("Dummy payment marked failed", result));
  } catch (error) { next(error); }
}

module.exports = { listPayments, getPayment, markSuccess, markFailed };
