require("dotenv").config();

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { runSeed } = require("./seedGuards");

runSeed("seedAdmin", async function seedAdmin() {
  const email = String(process.env.TEST_ADMIN_EMAIL || "").trim().toLowerCase();
  const phone = String(process.env.TEST_ADMIN_PHONE || "").trim();
  const password = String(process.env.TEST_ADMIN_PASSWORD || "");
  const fullName = String(process.env.TEST_ADMIN_NAME || "Umusare Admin").trim();

  if (!email && !phone) throw new Error("TEST_ADMIN_EMAIL or TEST_ADMIN_PHONE is required.");
  if (password.length < 8) throw new Error("TEST_ADMIN_PASSWORD must be at least 8 characters.");

  const existing = await User.findOne({
    $or: [email ? { email } : null, phone ? { phone } : null].filter(Boolean)
  });

  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    existing.fullName = fullName;
    existing.email = email || existing.email;
    existing.phone = phone || existing.phone;
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.status = "active";
    existing.isDemoData = false;
    await existing.save();
    await User.updateMany(
      {
        _id: { $ne: existing._id },
        role: "admin",
        isDemoData: true
      },
      { $set: { status: "disabled" } }
    );
    console.log("Updated admin:", existing.email || existing.phone);
    return;
  }

  const admin = await User.create({
    fullName,
    firstName: fullName.split(" ")[0],
    lastName: fullName.split(" ").slice(1).join(" "),
    email: email || undefined,
    phone: phone || undefined,
    passwordHash,
    authProvider: "local",
    role: "admin",
    status: "active",
    isDemoData: false
  });
  await User.updateMany(
    {
      _id: { $ne: admin._id },
      role: "admin",
      isDemoData: true
    },
    { $set: { status: "disabled" } }
  );
  console.log("Created admin:", email || phone);
});
