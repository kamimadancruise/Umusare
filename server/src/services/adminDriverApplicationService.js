const mongoose = require("mongoose");
const DriverApplication = require("../models/DriverApplication");
const DriverDocument = require("../models/DriverDocument");
const DriverProfile = require("../models/DriverProfile");
const Subscription = require("../models/Subscription");
const AdminAuditLog = require("../models/AdminAuditLog");
const { buildDocumentChecklist } = require("../utils/documentChecklist");
const generatePublicDriverId = require("../utils/publicDriverId");

const REQUIRED_DOCUMENT_TYPES = [
  "National ID / Passport",
  "Driver's Licence",
  "Proof of secondary education",
  "Profile photo",
  "Police Clearance / Criminal Record Certificate"
];

const ALLOWED_STATUS_UPDATES = ["Under Review", "Needs More Info", "Approved", "Rejected"];

function createHttpError(message, statusCode = 400, errors = []) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
}

function ensureObjectId(id, message) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(message, 404);
  }
}

async function createAuditLog(adminUser, action, targetType, targetId, description, metadata = {}) {
  await AdminAuditLog.create({
    adminUserId: adminUser._id,
    action,
    targetType,
    targetId: String(targetId),
    description,
    metadata
  });
}

function serializeDocument(document) {
  return {
    id: document._id,
    documentType: document.documentType,
    fileName: document.fileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    status: document.status,
    rejectionReason: document.rejectionReason,
    verifiedAt: document.verifiedAt,
    uploadedAt: document.uploadedAt
  };
}

function documentSummary(documents) {
  const checklist = buildDocumentChecklist(documents);
  const values = Object.values(checklist);
  return {
    checklist,
    submittedCount: values.filter(function (status) { return status !== "Missing"; }).length,
    verifiedCount: values.filter(function (status) { return status === "Verified"; }).length,
    totalRequired: REQUIRED_DOCUMENT_TYPES.length,
    complete: values.every(function (status) { return status !== "Missing"; }),
    allVerified: values.every(function (status) { return status === "Verified"; })
  };
}

async function getApplicationOrThrow(applicationId) {
  ensureObjectId(applicationId, "Driver application not found");
  const application = await DriverApplication.findById(applicationId).populate("userId", "fullName firstName lastName email phone role status profilePhoto city createdAt");
  if (!application) {
    throw createHttpError("Driver application not found", 404);
  }
  return application;
}

async function listApplications(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.city) filter.city = new RegExp(String(query.city), "i");
  if (query.selectedSubscriptionPlan) filter.selectedSubscriptionPlan = query.selectedSubscriptionPlan;
  if (query.search) {
    const search = new RegExp(String(query.search).trim(), "i");
    filter.$or = [
      { fullName: search },
      { email: search },
      { phone: search },
      { applicationNumber: search }
    ];
  }

  const [applications, total] = await Promise.all([
    DriverApplication.find(filter).sort({ submittedAt: -1 }).skip((page - 1) * limit).limit(limit),
    DriverApplication.countDocuments(filter)
  ]);
  const applicationIds = applications.map(function (application) { return application._id; });
  const documents = await DriverDocument.find({ applicationId: { $in: applicationIds } });
  const documentsByApplication = documents.reduce(function (map, document) {
    const key = String(document.applicationId);
    map[key] = map[key] || [];
    map[key].push(document);
    return map;
  }, {});

  return {
    applications: applications.map(function (application) {
      const summary = documentSummary(documentsByApplication[String(application._id)] || []);
      return {
        id: application._id,
        applicationNumber: application.applicationNumber,
        fullName: application.fullName,
        phone: application.phone,
        email: application.email,
        city: application.city,
        experienceYears: application.experienceYears,
        selectedSubscriptionPlan: application.selectedSubscriptionPlan,
        status: application.status,
        submittedAt: application.submittedAt,
        documentSummary: summary
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getApplicationDetail(applicationId) {
  const application = await getApplicationOrThrow(applicationId);
  const documents = await DriverDocument.find({ applicationId: application._id }).sort({ documentType: 1 });
  const summary = documentSummary(documents);

  return {
    application,
    applicant: application.userId,
    documents: documents.map(serializeDocument),
    documentChecklist: summary.checklist,
    documentSummary: summary,
    adminNotes: application.adminNotes,
    requestedInfo: application.requestedInfo,
    rejectionReason: application.rejectionReason
  };
}

async function getDocumentForApplication(applicationId, documentId) {
  ensureObjectId(applicationId, "Driver application not found");
  ensureObjectId(documentId, "Driver document not found");
  const document = await DriverDocument.findOne({ _id: documentId, applicationId });
  if (!document) {
    throw createHttpError("Driver document not found", 404);
  }
  return document;
}

async function setDocumentStatus(adminUser, applicationId, documentId, status, rejectionReason) {
  const document = await getDocumentForApplication(applicationId, documentId);
  if (status === "Rejected" && !rejectionReason) {
    throw createHttpError("Document rejection reason is required");
  }

  document.status = status;
  document.rejectionReason = status === "Rejected" ? rejectionReason : undefined;
  document.verifiedBy = status === "Verified" ? adminUser._id : undefined;
  document.verifiedAt = status === "Verified" ? new Date() : undefined;
  await document.save();

  const action = status === "Verified"
    ? "VERIFY_DRIVER_DOCUMENT"
    : status === "Rejected"
      ? "REJECT_DRIVER_DOCUMENT"
      : "MARK_DRIVER_DOCUMENT_NEEDS_REVIEW";

  await createAuditLog(adminUser, action, "DriverDocument", document._id, "Driver document marked " + status, {
    applicationId,
    documentType: document.documentType
  });

  return serializeDocument(document);
}

async function viewDocumentMetadata(applicationId, documentId) {
  const document = await getDocumentForApplication(applicationId, documentId);
  // Production should use secure private cloud storage and signed URLs for admin-only document access.
  return {
    id: document._id,
    documentType: document.documentType,
    fileName: document.fileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    status: document.status,
    localFilePath: document.fileUrl,
    note: "Protected metadata placeholder. Use signed private URLs before production."
  };
}

async function ensureSubscription(driverProfile, application) {
  const existingSubscription = await Subscription.findOne({ driverId: driverProfile._id });
  if (existingSubscription) return existingSubscription;

  // Real payment activation comes later. Pending subscriptions keep approved drivers hidden.
  return Subscription.create({
    subscriptionId: "UMA-SUB-" + String(Date.now()),
    driverId: driverProfile._id,
    driverUserId: application.userId._id || application.userId,
    plan: application.selectedSubscriptionPlan,
    monthlyFee: application.selectedSubscriptionPlan === "Pro" ? 5000 : 2500,
    currency: "RWF",
    status: "Pending",
    paymentStatus: "Pending",
    bookingsUsedThisMonth: 0
  });
}

async function approveApplication(adminUser, application) {
  if (application.status === "Approved") {
    throw createHttpError("Driver application is already approved", 409);
  }

  const documents = await DriverDocument.find({ applicationId: application._id });
  const summary = documentSummary(documents);
  if (!summary.allVerified) {
    throw createHttpError("All required documents must be verified before approval.", 409);
  }

  application.status = "Approved";
  application.reviewedAt = new Date();
  application.reviewedBy = adminUser._id;
  application.rejectionReason = undefined;
  await application.save();

  let driverProfile = await DriverProfile.findOne({ userId: application.userId._id || application.userId });
  if (!driverProfile) {
    driverProfile = new DriverProfile({
      userId: application.userId._id || application.userId,
      publicDriverId: await generatePublicDriverId(application.fullName)
    });
  }

  Object.assign(driverProfile, {
    gender: application.gender,
    age: application.age,
    city: application.city,
    location: application.location,
    experienceYears: application.experienceYears,
    languages: application.languages,
    vehicleTypes: application.vehicleTypes,
    shortBio: application.shortBio,
    verificationStatus: "Verified",
    isApproved: true,
    isSuspended: false,
    suspensionReason: undefined,
    approvedAt: new Date(),
    approvedBy: adminUser._id,
    availability: driverProfile.availability || "Offline",
    ratingAverage: driverProfile.ratingAverage || 0,
    reviewCount: driverProfile.reviewCount || 0,
    completedTrips: driverProfile.completedTrips || 0,
    driverBadge: application.selectedSubscriptionPlan === "Pro" ? "Pro Driver" : "Verified Driver",
    profileVisibility: "Hidden"
  });

  await driverProfile.save();
  const subscription = await ensureSubscription(driverProfile, application);
  driverProfile.profileVisibility = subscription.status === "Active" ? "Visible" : "Hidden";
  await driverProfile.save();

  await createAuditLog(adminUser, "APPROVE_DRIVER_APPLICATION", "DriverApplication", application._id, "Driver application approved", {
    driverProfileId: driverProfile._id,
    subscriptionId: subscription._id
  });
  await createAuditLog(adminUser, "UPSERT_DRIVER_PROFILE", "DriverProfile", driverProfile._id, "Driver profile created or updated after approval", {
    applicationId: application._id
  });

  return { application, driverProfile, subscription };
}

async function updateApplicationStatus(adminUser, applicationId, input) {
  const application = await getApplicationOrThrow(applicationId);
  const status = input.status;
  if (!ALLOWED_STATUS_UPDATES.includes(status)) {
    throw createHttpError("Invalid application status");
  }

  if (status === "Approved") {
    return approveApplication(adminUser, application);
  }

  if (status === "Needs More Info" && !input.requestedInfo) {
    throw createHttpError("Requested information message is required");
  }
  if (status === "Rejected" && !input.rejectionReason) {
    throw createHttpError("Rejection reason is required");
  }

  application.status = status;
  application.reviewedAt = new Date();
  application.reviewedBy = adminUser._id;
  if (status === "Needs More Info") application.requestedInfo = input.requestedInfo;
  if (status === "Rejected") application.rejectionReason = input.rejectionReason;
  await application.save();

  const action = status === "Under Review"
    ? "SET_DRIVER_APPLICATION_UNDER_REVIEW"
    : status === "Needs More Info"
      ? "REQUEST_DRIVER_APPLICATION_INFO"
      : "REJECT_DRIVER_APPLICATION";

  await createAuditLog(adminUser, action, "DriverApplication", application._id, "Driver application status set to " + status, {
    requestedInfo: input.requestedInfo,
    rejectionReason: input.rejectionReason
  });

  return { application };
}

module.exports = {
  listApplications,
  getApplicationDetail,
  updateApplicationStatus,
  setDocumentStatus,
  viewDocumentMetadata
};
