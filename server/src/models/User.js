const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String },
    authProvider: { type: String, enum: ["local", "google", "apple"], default: "local", required: true },
    googleId: { type: String, trim: true, index: true, sparse: true },
    appleId: { type: String, trim: true, index: true, sparse: true },
    role: { type: String, enum: ["client", "driver", "admin"], required: true, index: true },
    status: { type: String, enum: ["active", "suspended", "pending", "disabled"], default: "pending", index: true },
    profilePhoto: { type: String, trim: true },
    city: { type: String, trim: true },
    lastLoginAt: { type: Date },
    isDemoData: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model("User", userSchema);
