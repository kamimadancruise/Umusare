const Subscription = require("../models/Subscription");

async function generateSubscriptionId() {
  const count = await Subscription.countDocuments();
  return "UMA-SUB-" + String(count + 1).padStart(6, "0");
}

module.exports = generateSubscriptionId;
