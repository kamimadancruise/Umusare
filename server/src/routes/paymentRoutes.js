const express = require("express");
const paymentController = require("../controllers/paymentController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const requireDummyPaymentsEnabled = require("../middleware/requireDummyPaymentsEnabled");

const router = express.Router();

router.post("/dummy-subscription-payment", requireAuth, requireRole("driver"), requireDummyPaymentsEnabled, paymentController.createDummySubscriptionPayment);
router.post("/subscription/mobile-money/initiate", requireAuth, requireRole("driver"), paymentController.initiateMobileMoneySubscriptionPayment);
router.post("/webhook/mobile-money", paymentController.mobileMoneyWebhook);
router.get("/me", requireAuth, requireRole("driver"), paymentController.listMyPayments);
router.get("/:paymentId/status", requireAuth, paymentController.getPaymentStatus);

module.exports = router;
