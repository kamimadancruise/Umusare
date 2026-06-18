const paymentService = require("../../services/paymentService");
const { successResponse } = require("../../utils/apiResponse");

async function mobileMoneyWebhook(req, res, next) {
  try {
    // TODO: Verify provider webhook signature before trusting this payload.
    // Use HTTPS, idempotent processing, and provider confirmation as the source of truth.
    const result = await paymentService.handleMobileMoneyWebhook(req.body, req.headers);
    res.json(successResponse("Mobile Money webhook received", result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  mobileMoneyWebhook
};
