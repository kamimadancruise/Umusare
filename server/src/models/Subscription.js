const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: { type: String, trim: true, required: true, unique: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "DriverProfile", required: true, index: true },
    driverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["Basic", "Pro"], required: true, index: true },
    monthlyFee: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["RWF"], default: "RWF" },
    status: { type: String, enum: ["Active", "Pending", "Expired", "Cancelled"], default: "Pending", index: true },
    startedAt: { type: Date },
    renewalDate: { type: Date, index: true },
    expiredAt: { type: Date },
    cancelledAt: { type: Date },
    bookingsUsedThisMonth: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ["Paid", "Pending", "Failed", "Dummy Paid", "Manual Admin Approval"], default: "Pending", index: true },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

subscriptionSchema.index({ driverId: 1, status: 1 });
subscriptionSchema.index({ status: 1, renewalDate: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
