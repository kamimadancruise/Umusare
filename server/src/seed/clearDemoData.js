const User = require("../models/User");
const ClientProfile = require("../models/ClientProfile");
const DriverProfile = require("../models/DriverProfile");
const DriverApplication = require("../models/DriverApplication");
const DriverDocument = require("../models/DriverDocument");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const IncidentReport = require("../models/IncidentReport");
const Subscription = require("../models/Subscription");
const DummyPayment = require("../models/DummyPayment");
const { assertDemoDataEnabled, runSeed } = require("./seedGuards");

runSeed("clearDemoData", async function clearDemoData() {
  assertDemoDataEnabled("clearDemoData");
  const models = [DummyPayment, IncidentReport, Review, Booking, Subscription, DriverDocument, DriverApplication, DriverProfile, ClientProfile, User];
  for (const Model of models) {
    const result = await Model.deleteMany({ isDemoData: true });
    console.log(Model.modelName + ": removed " + result.deletedCount + " demo records.");
  }
});
