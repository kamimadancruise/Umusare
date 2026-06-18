const express = require("express");
const adminPaymentController = require("../controllers/adminPaymentController");

const router = express.Router();

router.get("/", adminPaymentController.listPayments);
router.get("/:paymentId", adminPaymentController.getPayment);
router.patch("/:paymentId/mark-success", adminPaymentController.markSuccess);
router.patch("/:paymentId/mark-failed", adminPaymentController.markFailed);

module.exports = router;
