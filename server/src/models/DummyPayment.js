const mongoose = require("mongoose");

const dummyPaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, trim: true, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["RWF"], default: "RWF" },
    paymentMethod: { type: String, enum: ["Dummy Mobile Money", "Manual Admin Approval", "Test Payment", "Mobile Money"], required: true },
    provider: { type: String, trim: true },
    providerTransactionId: { type: String, trim: true, index: true, sparse: true },
    externalReference: { type: String, trim: true, index: true, sparse: true },
    status: { type: String, enum: ["Pending", "Processing", "Success", "Failed", "Cancelled"], default: "Pending", index: true },
    transactionReference: { type: String, trim: true, index: true, sparse: true },
    phoneNumber: { type: String, trim: true },
    failureReason: { type: String, trim: true },
    webhookReceivedAt: { type: Date },
    rawProviderResponse: { type: mongoose.Schema.Types.Mixed, select: false },
    paidAt: { type: Date },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

dummyPaymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("DummyPayment", dummyPaymentSchema);
