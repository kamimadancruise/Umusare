const DriverProfile = require("../models/DriverProfile");
const Subscription = require("../models/Subscription");
const Review = require("../models/Review");
const { canDriverBeVisible } = require("./driverVisibilityService");

const EDITABLE_PROFILE_FIELDS = [
  "city",
  "location",
  "languages",
  "vehicleTypes",
  "shortBio",
  "profilePhoto",
  "gender",
  "experienceYears"
];

const VALID_AVAILABILITY = ["Available Now", "Available Later", "Offline"];
const VALID_VEHICLE_TYPES = ["Automatic", "Manual", "SUV", "Pickup", "Luxury car", "Other"];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map(function (item) { return String(item).trim(); }).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map(function (item) { return item.trim(); }).filter(Boolean);
  }
  return undefined;
}

function publicVerificationBadges() {
  return {
    idVerified: true,
    licenceVerified: true,
    educationVerified: true,
    profilePhotoVerified: true,
    criminalRecordChecked: true
  };
}

function serializePublicDriver(driverProfile) {
  const user = driverProfile.userId || {};
  return {
    publicDriverId: driverProfile.publicDriverId,
    fullName: user.fullName || "Verified Umusare Driver",
    displayName: user.firstName || user.fullName || "Verified Driver",
    city: driverProfile.city,
    location: driverProfile.location,
    gender: driverProfile.gender,
    experienceYears: driverProfile.experienceYears,
    languages: driverProfile.languages,
    vehicleTypes: driverProfile.vehicleTypes,
    shortBio: driverProfile.shortBio,
    ratingAverage: driverProfile.ratingAverage,
    reviewCount: driverProfile.reviewCount,
    completedTrips: driverProfile.completedTrips,
    availability: driverProfile.availability,
    availableLater: driverProfile.availability === "Available Later" ? driverProfile.availableLater : undefined,
    driverBadge: driverProfile.driverBadge,
    profilePhoto: user.profilePhoto,
    verificationBadges: publicVerificationBadges()
  };
}

function serializePublicReview(review) {
  const clientUser = review.clientId && review.clientId.userId ? review.clientId.userId : {};
  return {
    clientFirstName: clientUser.firstName || String(clientUser.fullName || "Client").split(" ")[0],
    rating: review.rating,
    reviewText: review.reviewText,
    createdAt: review.createdAt
  };
}

function serializePrivateDriver(driverProfile, subscription) {
  const user = driverProfile.userId || {};
  return {
    profile: {
      id: driverProfile._id,
      publicDriverId: driverProfile.publicDriverId,
      city: driverProfile.city,
      location: driverProfile.location,
      gender: driverProfile.gender,
      experienceYears: driverProfile.experienceYears,
      languages: driverProfile.languages,
      vehicleTypes: driverProfile.vehicleTypes,
      shortBio: driverProfile.shortBio,
      ratingAverage: driverProfile.ratingAverage,
      reviewCount: driverProfile.reviewCount,
      completedTrips: driverProfile.completedTrips,
      availability: driverProfile.availability,
      availableLater: driverProfile.availableLater,
      driverBadge: driverProfile.driverBadge,
      profileVisibility: driverProfile.profileVisibility,
      verificationStatus: driverProfile.verificationStatus,
      isApproved: driverProfile.isApproved,
      isSuspended: driverProfile.isSuspended,
      suspensionReason: driverProfile.suspensionReason
    },
    user: {
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profilePhoto: user.profilePhoto
    },
    subscription: subscription ? {
      plan: subscription.plan,
      status: subscription.status,
      paymentStatus: subscription.paymentStatus,
      monthlyFee: subscription.monthlyFee,
      renewalDate: subscription.renewalDate,
      bookingsUsedThisMonth: subscription.bookingsUsedThisMonth
    } : null,
    canAppearPublicly: canDriverBeVisible(driverProfile, subscription)
  };
}

async function findOwnDriverProfile(userId) {
  const driverProfile = await DriverProfile.findOne({ userId }).populate("userId", "fullName firstName lastName email phone profilePhoto city");
  if (!driverProfile) {
    throw createHttpError("Your driver profile is not approved yet.", 404);
  }
  return driverProfile;
}

async function getOwnProfile(user) {
  const driverProfile = await findOwnDriverProfile(user._id);
  const subscription = await Subscription.findOne({ driverId: driverProfile._id });
  return serializePrivateDriver(driverProfile, subscription);
}

async function updateOwnProfile(user, input) {
  const driverProfile = await findOwnDriverProfile(user._id);
  if (!driverProfile.isApproved) {
    throw createHttpError("Your driver profile is not approved yet.", 403);
  }
  if (driverProfile.isSuspended) {
    throw createHttpError("Your driver profile is currently suspended.", 403);
  }

  EDITABLE_PROFILE_FIELDS.forEach(function (field) {
    if (typeof input[field] === "undefined") return;
    if (field === "languages") {
      const languages = normalizeStringList(input.languages);
      if (languages) driverProfile.languages = languages;
      return;
    }
    if (field === "vehicleTypes") {
      const vehicleTypes = normalizeStringList(input.vehicleTypes);
      if (vehicleTypes && vehicleTypes.every(function (type) { return VALID_VEHICLE_TYPES.includes(type); })) {
        driverProfile.vehicleTypes = vehicleTypes;
      }
      return;
    }
    if (field === "experienceYears") {
      driverProfile.experienceYears = Math.max(Number(input.experienceYears) || 0, 0);
      return;
    }
    driverProfile[field] = input[field];
  });

  if (input.profilePhoto && driverProfile.userId) {
    driverProfile.userId.profilePhoto = input.profilePhoto;
    await driverProfile.userId.save();
  }

  await driverProfile.save();
  const subscription = await Subscription.findOne({ driverId: driverProfile._id });
  return serializePrivateDriver(driverProfile, subscription);
}

async function updateOwnAvailability(user, input) {
  const driverProfile = await findOwnDriverProfile(user._id);
  if (!driverProfile.isApproved) {
    throw createHttpError("Your driver profile is not approved yet.", 403);
  }
  if (driverProfile.isSuspended && input.availability === "Available Now") {
    throw createHttpError("Your driver profile is currently suspended.", 403);
  }
  if (!VALID_AVAILABILITY.includes(input.availability)) {
    throw createHttpError("Invalid availability status");
  }

  driverProfile.availability = input.availability;
  if (input.availability === "Available Later") {
    const later = input.availableLater || {};
    if (!later.date || !later.startTime || !later.endTime) {
      throw createHttpError("Available Later requires date, start time, and end time.");
    }
    driverProfile.availableLater = {
      date: later.date,
      startTime: later.startTime,
      endTime: later.endTime
    };
  } else {
    driverProfile.availableLater = undefined;
  }

  await driverProfile.save();
  return {
    message: "Availability updated successfully.",
    availability: driverProfile.availability,
    availableLater: driverProfile.availableLater
  };
}

async function activeSubscriptionDriverIds() {
  const subscriptions = await Subscription.find({ status: "Active" }).select("driverId");
  return subscriptions.map(function (subscription) {
    return subscription.driverId;
  });
}

function applyPublicFilters(filter, query) {
  if (query.availability) filter.availability = query.availability;
  if (query.city) filter.city = new RegExp(String(query.city), "i");
  if (query.ratingMin) filter.ratingAverage = { $gte: Number(query.ratingMin) || 0 };
  if (query.experienceMin) filter.experienceYears = { $gte: Number(query.experienceMin) || 0 };
  if (query.gender) filter.gender = query.gender;
  if (query.language) filter.languages = query.language;
  if (query.vehicleType) filter.vehicleTypes = query.vehicleType;
  if (query.driverBadge) filter.driverBadge = query.driverBadge;
  if (query.search) {
    const search = new RegExp(String(query.search), "i");
    filter.$or = [
      { city: search },
      { location: search },
      { languages: search },
      { vehicleTypes: search },
      { driverBadge: search },
      { shortBio: search }
    ];
  }
}

async function listPublicDrivers(query = {}) {
  // Subscription visibility check will be enforced after dummy payment/subscription backend is connected.
  const activeDriverIds = await activeSubscriptionDriverIds();
  const filter = {
    _id: { $in: activeDriverIds },
    isApproved: true,
    isSuspended: false,
    verificationStatus: "Verified",
    profileVisibility: "Visible"
  };

  applyPublicFilters(filter, query);

  let drivers = await DriverProfile.find(filter)
    .populate("userId", "fullName firstName lastName profilePhoto city")
    .sort({ driverBadge: -1, ratingAverage: -1, completedTrips: -1 });

  if (query.search) {
    const searchTerm = String(query.search).toLowerCase();
    drivers = drivers.filter(function (driver) {
      const user = driver.userId || {};
      return [
        user.fullName,
        user.firstName,
        driver.city,
        driver.location,
        driver.languages && driver.languages.join(" "),
        driver.vehicleTypes && driver.vehicleTypes.join(" "),
        driver.driverBadge,
        driver.shortBio
      ].join(" ").toLowerCase().includes(searchTerm);
    });
  }

  return { drivers: drivers.map(serializePublicDriver) };
}

async function getPublicDriver(publicDriverId) {
  const activeDriverIds = await activeSubscriptionDriverIds();
  const driverProfile = await DriverProfile.findOne({
    _id: { $in: activeDriverIds },
    publicDriverId,
    isApproved: true,
    isSuspended: false,
    verificationStatus: "Verified",
    profileVisibility: "Visible"
  }).populate("userId", "fullName firstName lastName profilePhoto city");

  if (!driverProfile) {
    throw createHttpError("Driver profile not available.", 404);
  }

  const reviews = await Review.find({ driverId: driverProfile._id })
    .populate({ path: "clientId", select: "userId", populate: { path: "userId", select: "firstName fullName" } })
    .sort({ createdAt: -1 })
    .limit(20);

  return {
    driver: serializePublicDriver(driverProfile),
    ratingSummary: {
      average: driverProfile.ratingAverage,
      reviewCount: driverProfile.reviewCount,
      completedTrips: driverProfile.completedTrips
    },
    reviews: reviews.map(serializePublicReview)
  };
}

module.exports = {
  getOwnProfile,
  updateOwnProfile,
  updateOwnAvailability,
  listPublicDrivers,
  getPublicDriver,
  serializePublicDriver
};
