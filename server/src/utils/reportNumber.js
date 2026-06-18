const IncidentReport = require("../models/IncidentReport");

async function generateReportId() {
  const count = await IncidentReport.countDocuments();
  return "UMA-REP-" + String(count + 1).padStart(6, "0");
}

module.exports = generateReportId;
