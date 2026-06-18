const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewId: { type: String, trim: true, required: true, unique: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", required: true, index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "DriverProfile", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, trim: true, maxlength: 1500 },
    flagged: { type: Boolean, default: false, index: true },
    flagReason: { type: String, trim: true },
    adminReviewed: { type: Boolean, default: false },
    adminReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminReviewedAt: { type: Date },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

reviewSchema.index({ bookingId: 1, clientId: 1 }, { unique: true });
reviewSchema.index({ driverId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, flagged: 1 });

module.exports = mongoose.model("Review", reviewSchema);
