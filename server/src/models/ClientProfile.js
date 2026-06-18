const mongoose = require("mongoose");

const clientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    savedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "DriverProfile" }],
    totalBookings: { type: Number, default: 0, min: 0 },
    completedBookings: { type: Number, default: 0, min: 0 },
    openReports: { type: Number, default: 0, min: 0 },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClientProfile", clientProfileSchema);
