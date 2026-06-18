const DummyPayment = require("../models/DummyPayment");

async function generatePaymentId() {
  const count = await DummyPayment.countDocuments();
  return "UMA-PAY-" + String(count + 1).padStart(6, "0");
}

module.exports = generatePaymentId;
