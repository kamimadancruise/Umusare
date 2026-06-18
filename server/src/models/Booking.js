const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["Pending", "Accepted", "Driver on the way", "Trip started", "Completed", "Cancelled", "Reported", "Reviewed"], required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String, trim: true }
  },
  { _id: false }
);

const candidateDriverSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "DriverProfile", required: true },
    matchScore: { type: Number, default: 0 },
    matchReasons: [{ type: String, trim: true }],
    addedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, trim: true, required: true, unique: true },
    bookingType: { type: String, enum: ["Quick Book", "Plan Ahead"], required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", index: true },
    clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    guestClientName: { type: String, trim: true },
    guestClientPhone: { type: String, trim: true },
    guestClientEmail: { type: String, trim: true, lowercase: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "DriverProfile", index: true },
    driverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    candidateDrivers: [candidateDriverSchema],
    pickupLocation: { type: String, trim: true, required: true },
    destination: { type: String, trim: true, required: true },
    dateTime: { type: Date, required: true, index: true },
    neededTime: { type: String, enum: ["ASAP", "In 15 minutes", "In 30 minutes", "In 1 hour", "Custom"], required: true },
    customTime: { type: Date },
    carType: { type: String, enum: ["Automatic", "Manual", "SUV", "Pickup", "Luxury car", "Not sure", "Other"], required: true },
    clientNotes: { type: String, trim: true },
    driverNotes: { type: String, trim: true },
    status: { type: String, enum: ["Pending", "Accepted", "Driver on the way", "Trip started", "Completed", "Cancelled", "Reported", "Reviewed"], default: "Pending", index: true },
    statusHistory: [statusHistorySchema],
    acceptedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
    lastUpdated: { type: Date, default: Date.now },
    returnTripNeeded: { type: Boolean, default: false },
    returnTime: { type: Date },
    additionalStops: [{ type: String, trim: true }],
    tripType: { type: String, trim: true },
    preferredDriverGender: { type: String, enum: ["Any", "Male", "Female"] },
    preferredMinExperience: { type: String, enum: ["Any", "2+ years", "5+ years", "10+ years"] },
    preferredLanguages: [{ type: String, trim: true }],
    preferredRating: { type: String, enum: ["Any", "4+ stars", "4.5+ stars"] },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, dateTime: -1 });
bookingSchema.index({ clientUserId: 1, status: 1 });
bookingSchema.index({ driverUserId: 1, status: 1 });
bookingSchema.index({ "candidateDrivers.driverId": 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
