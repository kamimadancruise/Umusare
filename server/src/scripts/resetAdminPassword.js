require("dotenv").config();
const dns = require("node:dns");

const dnsServers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

dns.setServers(dnsServers);
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

async function resetAdminPassword() {
  const databaseUrl = process.env.DATABASE_URL;
  const adminEmail = process.env.RESET_ADMIN_EMAIL;
  const newPassword = process.env.RESET_ADMIN_PASSWORD;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  if (!adminEmail) {
    throw new Error("RESET_ADMIN_EMAIL is missing.");
  }

  if (!newPassword || newPassword.length < 10) {
    throw new Error(
      "RESET_ADMIN_PASSWORD must contain at least 10 characters."
    );
  }

  await mongoose.connect(databaseUrl);

  const normalizedEmail = adminEmail.trim().toLowerCase();

  const admin = await User.findOne({
    email: normalizedEmail,
  });

  if (!admin) {
    throw new Error(`No user found with email: ${normalizedEmail}`);
  }

  if (admin.role !== "admin") {
    throw new Error(
      "The selected user is not an admin. Password was not changed."
    );
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 12);

  // Reset common login-lock fields if they exist in the model.
  if ("failedLoginAttempts" in admin) {
    admin.failedLoginAttempts = 0;
  }

  if ("loginAttempts" in admin) {
    admin.loginAttempts = 0;
  }

  if ("lockUntil" in admin) {
    admin.lockUntil = undefined;
  }

  if ("isActive" in admin) {
    admin.isActive = true;
  }

  await admin.save();

  console.log(`Admin password reset successfully for ${normalizedEmail}.`);
}

resetAdminPassword()
  .catch((error) => {
    console.error("Admin password reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });