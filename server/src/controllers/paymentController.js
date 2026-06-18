const paymentService = require("../services/paymentService");
const { successResponse } = require("../utils/apiResponse");

async function createDummySubscriptionPayment(req, res, next) {
  try {
    const result = await paymentService.createDummySubscriptionPayment(req.user, req.body);
    res.status(201).json(successResponse("Dummy subscription payment processed", result));
  } catch (error) {
    next(error);
  }
}

async function listMyPayments(req, res, next) {
  try {
    const result = await paymentService.listMyPayments(req.user);
    res.json(successResponse("Dummy payments loaded", result));
  } catch (error) {
    next(error);
  }
}

async function initiateMobileMoneySubscriptionPayment(req, res, next) {
  try {
    const result = await paymentService.initiateMobileMoneySubscriptionPayment(req.user, req.body);
    res.status(202).json(successResponse("Mobile Money subscription payment initiated", result));
  } catch (error) {
    next(error);
  }
}

async function getPaymentStatus(req, res, next) {
  try {
    const result = await paymentService.getPaymentStatus(req.user, req.params.paymentId);
    res.json(successResponse("Payment status loaded", result));
  } catch (error) {
    next(error);
  }
}

async function mobileMoneyWebhook(req, res, next) {
  try {
    const result = await paymentService.handleMobileMoneyWebhook(req.body, req.headers);
    res.json(successResponse("Mobile Money webhook received", result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDummySubscriptionPayment,
  initiateMobileMoneySubscriptionPayment,
  listMyPayments,
  getPaymentStatus,
  mobileMoneyWebhook
};
