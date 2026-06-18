const path = require("path");
const mongoose = require("mongoose");
const DriverApplication = require("../models/DriverApplication");
const DriverDocument = require("../models/DriverDocument");
const generateApplicationNumber = require("../utils/applicationNumber");
const { REQUIRED_DOCUMENTS, buildDocumentChecklist, getMissingRequiredDocuments } = require("../utils/documentChecklist");
const { normalizeList } = require("../validators/driverApplicationValidators");

const ACTIVE_APPLICATION_STATUSES = ["Pending", "Under Review", "Needs More Info", "Approved"];
const EDITABLE_STATUSES = ["Pending", "Needs More Info"];

function createHttpError(message, statusCode = 400, errors = []) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
}

function ensureDriver(user) {
  if (!user || user.role !== "driver") {
    throw createHttpError("Only driver accounts can access driver applications", 403);
  }
}

function sanitizeApplicationInput(input) {
  const sanitized = {
    fullName: String(input.fullName || "").trim(),
    phone: String(input.phone || "").trim(),
    email: input.email ? String(input.email).trim().toLowerCase() : undefined,
    age: Number(input.age),
    gender: input.gender,
    city: String(input.city || "").trim(),
    location: String(input.location || "").trim(),
    experienceYears: Number(input.experienceYears),
    languages: normalizeList(input.languages),
    vehicleTypes: normalizeList(input.vehicleTypes),
    driverLicenceNumber: String(input.driverLicenceNumber || "").trim(),
    shortBio: String(input.shortBio || "").trim(),
    selectedSubscriptionPlan: input.selectedSubscriptionPlan
  };

  Object.keys(sanitized).forEach(function (key) {
    if (sanitized[key] === "" || sanitized[key] === undefined || Number.isNaN(sanitized[key])) {
      delete sanitized[key];
    }
  });

  return sanitized;
}

function serializeDocument(document) {
  return {
    id: document._id,
    documentType: document.documentType,
    fileName: document.fileName,
    status: document.status,
    uploadedAt: document.uploadedAt,
    rejectionReason: document.rejectionReason
  };
}

async function loadOwnedApplication(user, applicationId) {
  ensureDriver(user);
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw createHttpError("Driver application not found", 404);
  }
  const application = await DriverApplication.findOne({ _id: applicationId, userId: user._id });
  if (!application) {
    throw createHttpError("Driver application not found", 404);
  }
  return application;
}

async function getDocumentsForApplication(applicationId) {
  return DriverDocument.find({ applicationId }).sort({ documentType: 1 });
}

async function createApplication(user, input) {
  ensureDriver(user);
  const existingApplication = await DriverApplication.findOne({
    userId: user._id,
    status: { $in: ACTIVE_APPLICATION_STATUSES }
  });

  if (existingApplication) {
    throw createHttpError("You already have an active driver application", 409);
  }

  const application = await DriverApplication.create({
    userId: user._id,
    applicationNumber: await generateApplicationNumber(),
    status: "Pending",
    submittedAt: new Date(),
    ...sanitizeApplicationInput(input)
  });

  return getApplicationStatus(user, application._id);
}

async function getCurrentApplication(user) {
  ensureDriver(user);
  const application = await DriverApplication.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!application) {
    throw createHttpError("No driver application found", 404);
  }
  return getApplicationStatus(user, application._id);
}

async function getApplicationStatus(user, applicationId) {
  const application = await loadOwnedApplication(user, applicationId);
  const documents = await getDocumentsForApplication(application._id);

  return {
    application,
    documents: documents.map(serializeDocument),
    documentChecklist: buildDocumentChecklist(documents),
    missingRequiredDocuments: getMissingRequiredDocuments(documents),
    adminNotes: application.adminNotes,
    requestedInfo: application.requestedInfo
  };
}

async function updateCurrentApplication(user, input) {
  ensureDriver(user);
  const application = await DriverApplication.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!application) {
    throw createHttpError("No driver application found", 404);
  }
  if (!EDITABLE_STATUSES.includes(application.status)) {
    throw createHttpError("This application can no longer be edited", 409);
  }

  Object.assign(application, sanitizeApplicationInput(input));
  await application.save();
  return getApplicationStatus(user, application._id);
}

async function withdrawCurrentApplication(user) {
  ensureDriver(user);
  const application = await DriverApplication.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!application) {
    throw createHttpError("No driver application found", 404);
  }
  if (!["Pending", "Needs More Info"].includes(application.status)) {
    throw createHttpError("This application cannot be withdrawn", 409);
  }
  application.status = "Withdrawn";
  await application.save();
  return getApplicationStatus(user, application._id);
}

async function uploadDocument(user, applicationId, documentKey, file) {
  const application = await loadOwnedApplication(user, applicationId);
  if (!file) {
    throw createHttpError("Document file is required");
  }

  const documentType = REQUIRED_DOCUMENTS[documentKey];
  if (!documentType) {
    throw createHttpError("Invalid document type", 400);
  }

  const filePath = path.join("uploads", "driver-documents", file.filename).replace(/\\/g, "/");
  const document = await DriverDocument.findOneAndUpdate(
    { applicationId: application._id, documentType },
    {
      userId: user._id,
      applicationId: application._id,
      documentType,
      fileName: file.originalname,
      fileUrl: filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: "Submitted",
      rejectionReason: undefined,
      verifiedBy: undefined,
      verifiedAt: undefined,
      uploadedAt: new Date()
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return {
    document: serializeDocument(document),
    applicationStatus: await getApplicationStatus(user, application._id)
  };
}

async function getApplicationDocuments(user, applicationId) {
  await loadOwnedApplication(user, applicationId);
  const documents = await getDocumentsForApplication(applicationId);
  return {
    documents: documents.map(serializeDocument),
    documentChecklist: buildDocumentChecklist(documents),
    missingRequiredDocuments: getMissingRequiredDocuments(documents)
  };
}

module.exports = {
  createApplication,
  getCurrentApplication,
  updateCurrentApplication,
  withdrawCurrentApplication,
  uploadDocument,
  getApplicationDocuments
};
