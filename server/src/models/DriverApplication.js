const mongoose = require("mongoose");

const driverApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationNumber: { type: String, trim: true, required: true, unique: true },
    fullName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    age: { type: Number, min: 18, required: true },
    gender: { type: String, enum: ["Female", "Male", "Prefer not to say"], required: true },
    city: { type: String, trim: true, required: true },
    location: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, required: true },
    languages: [{ type: String, trim: true }],
    vehicleTypes: [{ type: String, enum: ["Automatic", "Manual", "SUV", "Pickup", "Luxury car", "Other"] }],
    driverLicenceNumber: { type: String, trim: true, required: true },
    shortBio: { type: String, trim: true, maxlength: 1000 },
    selectedSubscriptionPlan: { type: String, enum: ["Basic", "Pro"], required: true },
    status: { type: String, enum: ["Pending", "Under Review", "Needs More Info", "Approved", "Rejected", "Withdrawn"], default: "Pending", index: true },
    adminNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    requestedInfo: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

driverApplicationSchema.index({ status: 1, submittedAt: -1 });
driverApplicationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("DriverApplication", driverApplicationSchema);
