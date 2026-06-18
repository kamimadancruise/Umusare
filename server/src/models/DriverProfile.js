const mongoose = require("mongoose");

const vehicleTypes = ["Automatic", "Manual", "SUV", "Pickup", "Luxury car", "Other"];

const availableLaterSchema = new mongoose.Schema(
  {
    date: { type: Date },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true }
  },
  { _id: false }
);

const driverProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    publicDriverId: { type: String, trim: true, required: true, unique: true },
    gender: { type: String, enum: ["Female", "Male", "Prefer not to say"] },
    age: { type: Number, min: 18 },
    city: { type: String, trim: true, index: true },
    location: { type: String, trim: true },
    experienceYears: { type: Number, default: 0, min: 0, index: true },
    languages: [{ type: String, trim: true }],
    vehicleTypes: [{ type: String, enum: vehicleTypes }],
    shortBio: { type: String, trim: true, maxlength: 1000 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    completedTrips: { type: Number, default: 0, min: 0 },
    availability: { type: String, enum: ["Available Now", "Available Later", "Offline"], default: "Offline", index: true },
    availableLater: availableLaterSchema,
    driverBadge: { type: String, enum: ["Verified Driver", "Pro Driver", "Top Driver"], default: "Verified Driver" },
    profileVisibility: { type: String, enum: ["Visible", "Hidden"], default: "Hidden", index: true },
    verificationStatus: { type: String, enum: ["Pending", "Under Review", "Verified", "Rejected"], default: "Pending", index: true },
    isApproved: { type: Boolean, default: false, index: true },
    isSuspended: { type: Boolean, default: false, index: true },
    suspensionReason: { type: String, trim: true },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

driverProfileSchema.index({ availability: 1, isApproved: 1, profileVisibility: 1, isSuspended: 1 });
driverProfileSchema.index({ city: 1, availability: 1, ratingAverage: -1 });

module.exports = mongoose.model("DriverProfile", driverProfileSchema);
