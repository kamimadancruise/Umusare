const mongoose = require("mongoose");

const evidenceFileSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, trim: true, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userType: { type: String, enum: ["Client", "Driver", "Admin", "Other"], required: true, index: true },
    fullName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    issueCategory: {
      type: String,
      enum: ["Booking help", "Driver issue", "Accident or incident", "Safety concern", "Lost or missing property", "Subscription issue", "Technical problem", "Other"],
      required: true
    },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    message: { type: String, trim: true, required: true, maxlength: 5000 },
    evidenceFiles: [evidenceFileSchema],
    status: { type: String, enum: ["New", "Under Review", "Resolved", "Closed"], default: "New", index: true },
    assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    adminNotes: { type: String, trim: true }
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
