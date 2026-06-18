const VALID_VEHICLE_TYPES = ["Automatic", "Manual", "SUV", "Pickup", "Luxury car", "Other"];
const VALID_PLANS = ["Basic", "Pro"];

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(function (item) { return String(item).trim(); }).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map(function (item) { return item.trim(); }).filter(Boolean);
  }
  return [];
}

function validateDriverApplication(body) {
  const errors = [];
  const age = Number(body.age);
  const experienceYears = Number(body.experienceYears);
  const languages = normalizeList(body.languages);
  const vehicleTypes = normalizeList(body.vehicleTypes);

  if (!body.fullName) errors.push({ field: "fullName", message: "Full name is required." });
  if (!body.phone && !body.email) errors.push({ field: "phone", message: "Phone or email is required." });
  if (!body.age || Number.isNaN(age) || age < 21) errors.push({ field: "age", message: "Driver age must be at least 21." });
  if (!body.gender) errors.push({ field: "gender", message: "Gender is required." });
  if (!body.city) errors.push({ field: "city", message: "City is required." });
  if (body.experienceYears === undefined || Number.isNaN(experienceYears) || experienceYears < 0) {
    errors.push({ field: "experienceYears", message: "Years of driving experience must be a valid number." });
  }
  if (!languages.length) errors.push({ field: "languages", message: "At least one language is required." });
  if (!vehicleTypes.length) errors.push({ field: "vehicleTypes", message: "At least one vehicle type is required." });
  vehicleTypes.forEach(function (type) {
    if (!VALID_VEHICLE_TYPES.includes(type)) {
      errors.push({ field: "vehicleTypes", message: type + " is not a valid vehicle type." });
    }
  });
  if (!body.driverLicenceNumber) errors.push({ field: "driverLicenceNumber", message: "Driver licence number is required." });
  if (!VALID_PLANS.includes(body.selectedSubscriptionPlan)) {
    errors.push({ field: "selectedSubscriptionPlan", message: "Selected subscription plan must be Basic or Pro." });
  }

  return errors;
}

function validateDriverApplicationUpdate(body) {
  const errors = [];
  const vehicleTypes = body.vehicleTypes === undefined ? [] : normalizeList(body.vehicleTypes);

  if (body.age !== undefined) {
    const age = Number(body.age);
    if (Number.isNaN(age) || age < 21) errors.push({ field: "age", message: "Driver age must be at least 21." });
  }
  if (body.experienceYears !== undefined) {
    const experienceYears = Number(body.experienceYears);
    if (Number.isNaN(experienceYears) || experienceYears < 0) {
      errors.push({ field: "experienceYears", message: "Years of driving experience must be a valid number." });
    }
  }
  if (body.vehicleTypes !== undefined) {
    if (!vehicleTypes.length) errors.push({ field: "vehicleTypes", message: "At least one vehicle type is required." });
    vehicleTypes.forEach(function (type) {
      if (!VALID_VEHICLE_TYPES.includes(type)) {
        errors.push({ field: "vehicleTypes", message: type + " is not a valid vehicle type." });
      }
    });
  }
  if (body.selectedSubscriptionPlan !== undefined && !VALID_PLANS.includes(body.selectedSubscriptionPlan)) {
    errors.push({ field: "selectedSubscriptionPlan", message: "Selected subscription plan must be Basic or Pro." });
  }

  return errors;
}

module.exports = {
  normalizeList,
  validateDriverApplication,
  validateDriverApplicationUpdate
};
