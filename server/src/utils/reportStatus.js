const REPORT_STATUSES = ["New", "Under Review", "Awaiting Response", "Resolved", "Escalated"];

const REPORT_STATUS_TRANSITIONS = {
  New: ["Under Review", "Escalated"],
  "Under Review": ["Awaiting Response", "Resolved", "Escalated"],
  "Awaiting Response": ["Under Review", "Resolved"],
  Escalated: ["Under Review", "Resolved"],
  Resolved: []
};

function canTransitionReportStatus(currentStatus, nextStatus) {
  return Boolean(REPORT_STATUS_TRANSITIONS[currentStatus] && REPORT_STATUS_TRANSITIONS[currentStatus].includes(nextStatus));
}

module.exports = {
  REPORT_STATUSES,
  canTransitionReportStatus
};
