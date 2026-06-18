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

const reportUpdateSchema = new mongoose.Schema(
  {
    message: { type: String, trim: true, required: true },
    visibility: { type: String, enum: ["public", "admin"], default: "public" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByRole: { type: String, enum: ["Client", "Driver", "Admin"] },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const incidentReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, trim: true, required: true, unique: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", index: true },
    reportedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportedByRole: { type: String, enum: ["Client", "Driver", "Admin"], required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "DriverProfile", index: true },
    reportType: {
      type: String,
      enum: ["Safety concern", "Accident", "Misconduct", "Theft or missing property", "Wrong driver arrived", "Vehicle issue", "Payment dispute", "Client misconduct", "Driver misconduct", "Other"],
      required: true,
      index: true
    },
    urgency: { type: String, enum: ["Low", "Medium", "High", "Emergency"], default: "Medium", index: true },
    description: { type: String, trim: true, required: true, maxlength: 5000 },
    evidenceFiles: [evidenceFileSchema],
    updates: [reportUpdateSchema],
    status: { type: String, enum: ["New", "Under Review", "Awaiting Response", "Resolved", "Escalated"], default: "New", index: true },
    adminNotes: { type: String, trim: true },
    assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    lastUpdated: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

incidentReportSchema.index({ status: 1, urgency: 1, createdAt: -1 });
incidentReportSchema.index({ reportedByUserId: 1, createdAt: -1 });

module.exports = mongoose.model("IncidentReport", incidentReportSchema);
