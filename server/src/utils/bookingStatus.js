const BOOKING_STATUSES = ["Pending", "Accepted", "Driver on the way", "Trip started", "Completed", "Cancelled", "Reported", "Reviewed"];

const STATUS_TRANSITIONS = {
  Pending: ["Accepted", "Cancelled", "Reported"],
  Accepted: ["Driver on the way", "Trip started", "Cancelled", "Reported"],
  "Driver on the way": ["Trip started", "Cancelled", "Reported"],
  "Trip started": ["Completed", "Reported"],
  Completed: ["Reviewed", "Reported"],
  Cancelled: [],
  Reported: [],
  Reviewed: []
};

function canTransitionBookingStatus(currentStatus, nextStatus) {
  return Boolean(STATUS_TRANSITIONS[currentStatus] && STATUS_TRANSITIONS[currentStatus].includes(nextStatus));
}

module.exports = {
  BOOKING_STATUSES,
  canTransitionBookingStatus
};
