const DriverApplication = require("../models/DriverApplication");

async function generateApplicationNumber() {
  const latestApplication = await DriverApplication.findOne({ applicationNumber: /^UMA-APP-/ })
    .sort({ createdAt: -1 })
    .select("applicationNumber")
    .lean();

  const latestNumber = latestApplication && latestApplication.applicationNumber
    ? Number(latestApplication.applicationNumber.replace("UMA-APP-", ""))
    : 0;

  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;
  return "UMA-APP-" + String(nextNumber).padStart(6, "0");
}

module.exports = generateApplicationNumber;
