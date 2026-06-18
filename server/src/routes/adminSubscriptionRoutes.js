const express = require("express");
const adminSubscriptionController = require("../controllers/adminSubscriptionController");

const router = express.Router();

router.get("/", adminSubscriptionController.listSubscriptions);
router.get("/:subscriptionId", adminSubscriptionController.getSubscription);
router.patch("/:subscriptionId/activate", adminSubscriptionController.activate);
router.patch("/:subscriptionId/expire", adminSubscriptionController.expire);
router.patch("/:subscriptionId/cancel", adminSubscriptionController.cancel);
router.patch("/:subscriptionId/change-plan", adminSubscriptionController.changePlan);

module.exports = router;
