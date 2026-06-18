const mongoose = require("mongoose");

const driverDocumentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "DriverApplication", required: true, index: true },
    documentType: {
      type: String,
      enum: [
        "National ID / Passport",
        "Driver's Licence",
        "Proof of secondary education",
        "Profile photo",
        "Police Clearance / Criminal Record Certificate"
      ],
      required: true
    },
    fileName: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    fileSize: { type: Number, min: 0 },
    status: { type: String, enum: ["Missing", "Submitted", "Needs Review", "Verified", "Rejected"], default: "Missing", index: true },
    rejectionReason: { type: String, trim: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    uploadedAt: { type: Date },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// Private documents must never be exposed publicly; only verification status may be shown.
driverDocumentSchema.index({ applicationId: 1, documentType: 1 }, { unique: true });
driverDocumentSchema.index({ status: 1, documentType: 1 });

module.exports = mongoose.model("DriverDocument", driverDocumentSchema);
