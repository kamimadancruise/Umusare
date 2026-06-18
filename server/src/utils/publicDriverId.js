const DriverProfile = require("../models/DriverProfile");

function slugify(value) {
  return String(value || "driver")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "driver";
}

async function generatePublicDriverId(fullName) {
  const base = slugify(fullName);
  let suffix = 1;
  let candidate = base;

  while (await DriverProfile.exists({ publicDriverId: candidate })) {
    suffix += 1;
    candidate = base + "-" + String(suffix).padStart(3, "0");
  }

  return candidate;
}

module.exports = generatePublicDriverId;
