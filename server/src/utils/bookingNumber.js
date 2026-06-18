const Booking = require("../models/Booking");

async function generateBookingId() {
  const count = await Booking.countDocuments();
  return "UMA-BKG-" + String(count + 1).padStart(6, "0");
}

module.exports = generateBookingId;
