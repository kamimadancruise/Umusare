const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, trim: true, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["Booking", "Application", "Payment", "Review", "Report", "Support", "System"], required: true, index: true },
    title: { type: String, trim: true, required: true },
    message: { type: String, trim: true, required: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
