const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ClientProfile = require("../models/ClientProfile");
const DriverProfile = require("../models/DriverProfile");
const DriverApplication = require("../models/DriverApplication");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const IncidentReport = require("../models/IncidentReport");
const Subscription = require("../models/Subscription");
const DummyPayment = require("../models/DummyPayment");
const generatePublicDriverId = require("../utils/publicDriverId");
const generateBookingId = require("../utils/bookingNumber");
const generateReviewId = require("../utils/reviewNumber");
const generateReportId = require("../utils/reportNumber");
const generatePaymentId = require("../utils/paymentNumber");
const { assertDemoDataEnabled, runSeed } = require("./seedGuards");

async function upsertUser(email, fullName, role, phone) {
  const passwordHash = await bcrypt.hash("password123", 12);
  return User.findOneAndUpdate(
    { email },
    {
      fullName,
      firstName: fullName.split(" ")[0],
      lastName: fullName.split(" ").slice(1).join(" "),
      email,
      phone,
      passwordHash,
      authProvider: "local",
      role,
      status: "active",
      city: "Kigali",
      isDemoData: true
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

runSeed("seedDemoData", async function seedDemoData() {
  assertDemoDataEnabled("seedDemoData");

  const clientUser = await upsertUser("demo.client@umusare.test", "Demo Client", "client", "+250788100001");
  const driverUser = await upsertUser("demo.driver@umusare.test", "Demo Driver", "driver", "+250788100002");

  const client = await ClientProfile.findOneAndUpdate(
    { userId: clientUser._id },
    { userId: clientUser._id, totalBookings: 1, completedBookings: 1, openReports: 1, isDemoData: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const existingDriver = await DriverProfile.findOne({ userId: driverUser._id });
  const driver = await DriverProfile.findOneAndUpdate(
    { userId: driverUser._id },
    {
      userId: driverUser._id,
      publicDriverId: existingDriver ? existingDriver.publicDriverId : await generatePublicDriverId("Demo Driver"),
      gender: "Male",
      age: 32,
      city: "Kigali",
      location: "Kigali",
      experienceYears: 7,
      languages: ["Kinyarwanda", "English"],
      vehicleTypes: ["Automatic", "Manual", "SUV"],
      shortBio: "Demo verified driver for local Umusare testing.",
      ratingAverage: 5,
      reviewCount: 1,
      completedTrips: 1,
      availability: "Available Now",
      driverBadge: "Pro Driver",
      profileVisibility: "Visible",
      verificationStatus: "Verified",
      isApproved: true,
      isSuspended: false,
      approvedAt: new Date(),
      isDemoData: true
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await DriverApplication.findOneAndUpdate(
    { userId: driverUser._id },
    {
      userId: driverUser._id,
      applicationNumber: "UMA-DEMO-APP-000001",
      fullName: "Demo Driver",
      phone: "+250788100002",
      email: "demo.driver@umusare.test",
      age: 32,
      gender: "Male",
      city: "Kigali",
      location: "Kigali",
      experienceYears: 7,
      languages: ["Kinyarwanda", "English"],
      vehicleTypes: ["Automatic", "Manual", "SUV"],
      driverLicenceNumber: "DEMO-LICENCE",
      shortBio: "Demo application for testing.",
      selectedSubscriptionPlan: "Pro",
      status: "Approved",
      submittedAt: new Date(),
      reviewedAt: new Date(),
      isDemoData: true
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const subscription = await Subscription.findOneAndUpdate(
    { driverId: driver._id },
    {
      subscriptionId: "UMA-DEMO-SUB-000001",
      driverId: driver._id,
      driverUserId: driverUser._id,
      plan: "Pro",
      monthlyFee: 5000,
      currency: "RWF",
      status: "Active",
      startedAt: new Date(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      bookingsUsedThisMonth: 1,
      paymentStatus: "Dummy Paid",
      isDemoData: true
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const booking = await Booking.create({
    bookingId: await generateBookingId(),
    bookingType: "Quick Book",
    clientId: client._id,
    clientUserId: clientUser._id,
    driverId: driver._id,
    driverUserId: driverUser._id,
    pickupLocation: "Kigali Heights",
    destination: "Kacyiru",
    dateTime: new Date(),
    neededTime: "ASAP",
    carType: "Automatic",
    status: "Completed",
    completedAt: new Date(),
    statusHistory: [{ status: "Completed", changedAt: new Date(), note: "Demo completed trip" }],
    isDemoData: true
  });

  await Review.create({
    reviewId: await generateReviewId(),
    bookingId: booking._id,
    clientId: client._id,
    driverId: driver._id,
    rating: 5,
    reviewText: "Professional and calm demo trip.",
    flagged: false,
    isDemoData: true
  });

  await IncidentReport.create({
    reportId: await generateReportId(),
    bookingId: booking._id,
    reportedByUserId: clientUser._id,
    reportedByRole: "Client",
    clientId: client._id,
    driverId: driver._id,
    reportType: "Safety concern",
    urgency: "Low",
    description: "Demo report for admin testing.",
    status: "New",
    isDemoData: true
  });

  await DummyPayment.create({
    paymentId: await generatePaymentId(),
    userId: driverUser._id,
    subscriptionId: subscription._id,
    amount: 5000,
    currency: "RWF",
    paymentMethod: "Dummy Mobile Money",
    status: "Success",
    phoneNumber: "+250788100002",
    paidAt: new Date(),
    isDemoData: true
  });

  console.log("Demo data seeded. Use configured local test credentials to sign in.");
});
