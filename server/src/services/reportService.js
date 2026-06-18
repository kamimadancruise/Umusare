const path = require("path");
const Booking = require("../models/Booking");
const ClientProfile = require("../models/ClientProfile");
const DriverProfile = require("../models/DriverProfile");
const IncidentReport = require("../models/IncidentReport");
const User = require("../models/User");
const AdminAuditLog = require("../models/AdminAuditLog");
const generateReportId = require("../utils/reportNumber");
const { REPORT_STATUSES, canTransitionReportStatus } = require("../utils/reportStatus");
const contactService = require("./contactService");

const REPORT_TYPES = ["Safety concern", "Accident", "Misconduct", "Theft or missing property", "Wrong driver arrived", "Vehicle issue", "Payment dispute", "Client misconduct", "Driver misconduct", "Other"];
const URGENCIES = ["Low", "Medium", "High", "Emergency"];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function roleLabel(user) {
  return user.role === "client" ? "Client" : user.role === "driver" ? "Driver" : "Admin";
}

function statusHistoryEntry(status, changedBy, note) {
  return { status, changedAt: new Date(), changedBy, note };
}

async function findBookingByPublicId(bookingId) {
  if (!bookingId) return null;
  return Booking.findOne({ bookingId })
    .populate("clientUserId", "fullName firstName phone email")
    .populate({ path: "driverId", select: "userId publicDriverId", populate: { path: "userId", select: "fullName firstName phone email" } });
}

async function getLinkedProfiles(user, booking) {
  const userClientProfile = user.role === "client" ? await ClientProfile.findOne({ userId: user._id }) : null;
  const userDriverProfile = user.role === "driver" ? await DriverProfile.findOne({ userId: user._id }) : null;
  if (!booking) return { clientProfile: userClientProfile, driverProfile: userDriverProfile, userDriverProfile };
  return {
    clientProfile: booking.clientId || userClientProfile,
    driverProfile: booking.driverId || userDriverProfile,
    userDriverProfile
  };
}

function canUserAccessBooking(user, booking, driverProfile) {
  if (!booking) return true;
  if (user.role === "client" && booking.clientUserId && String(booking.clientUserId._id || booking.clientUserId) === String(user._id)) return true;
  if (user.role === "driver" && booking.driverUserId && String(booking.driverUserId) === String(user._id)) return true;
  if (user.role === "driver" && driverProfile && booking.driverId && String(booking.driverId._id || booking.driverId) === String(driverProfile._id)) return true;
  return false;
}

function validateReportInput(input) {
  if (!REPORT_TYPES.includes(input.reportType)) throw createHttpError("Invalid report type");
  if (!URGENCIES.includes(input.urgency)) throw createHttpError("Invalid urgency level");
  if (!input.description || String(input.description).trim().length < 3) throw createHttpError("Description is required");
}

function safeReport(report, viewerRole) {
  const booking = report.bookingId || {};
  const client = report.clientId && report.clientId.userId ? report.clientId.userId : {};
  const driver = report.driverId && report.driverId.userId ? report.driverId.userId : {};
  const visibleUpdates = viewerRole === "admin" ? report.updates || [] : (report.updates || []).filter(function (update) { return update.visibility === "public"; });
  const output = {
    reportId: report.reportId,
    bookingId: booking.bookingId,
    reportedByRole: report.reportedByRole,
    reportType: report.reportType,
    urgency: report.urgency,
    description: report.description,
    shortDescription: report.description ? report.description.slice(0, 140) : "",
    status: report.status,
    evidenceFiles: (report.evidenceFiles || []).map(function (file) {
      return { fileName: file.fileName, mimeType: file.mimeType, uploadedAt: file.uploadedAt };
    }),
    updates: visibleUpdates,
    assignedAdmin: report.assignedAdminId && report.assignedAdminId.fullName,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    lastUpdated: report.lastUpdated,
    resolvedAt: report.resolvedAt,
    contactActions: contactService.getPublicSupportContactActions()
  };
  if (viewerRole === "admin") {
    output.clientName = client.fullName || "Client";
    output.clientPhone = client.phone;
    output.driverName = driver.fullName || "Driver";
    output.driverPhone = driver.phone;
    output.adminNotes = report.adminNotes;
    output.linkedBooking = booking.bookingId ? {
      bookingId: booking.bookingId,
      pickupLocation: booking.pickupLocation,
      destination: booking.destination,
      status: booking.status
    } : null;
  }
  return output;
}

async function createReport(user, input) {
  validateReportInput(input);
  const booking = await findBookingByPublicId(input.bookingId);
  const profiles = await getLinkedProfiles(user, booking);
  if (booking && !canUserAccessBooking(user, booking, profiles.userDriverProfile)) {
    throw createHttpError("Not authorized to report this booking", 403);
  }
  const report = await IncidentReport.create({
    reportId: await generateReportId(),
    bookingId: booking && booking._id,
    reportedByUserId: user._id,
    reportedByRole: roleLabel(user),
    clientId: booking ? booking.clientId : profiles.clientProfile && profiles.clientProfile._id,
    driverId: booking ? booking.driverId && booking.driverId._id : profiles.driverProfile && profiles.driverProfile._id,
    reportType: input.reportType,
    urgency: input.urgency,
    description: String(input.description).trim(),
    status: "New",
    updates: [{
      message: "Incident report created",
      visibility: "public",
      createdBy: user._id,
      createdByRole: roleLabel(user)
    }],
    lastUpdated: new Date()
  });

  if (booking && ["High", "Emergency"].includes(input.urgency) && !["Cancelled", "Reported"].includes(booking.status)) {
    if (!["Completed", "Reviewed"].includes(booking.status)) {
      booking.status = "Reported";
    }
    booking.statusHistory.push(statusHistoryEntry(booking.status, user._id, "Incident report created"));
    booking.lastUpdated = new Date();
    await booking.save();
  }

  const populated = await findReportById(report.reportId);
  return { report: safeReport(populated, user.role), urgentSupport: input.urgency === "Emergency" };
}

async function findReportById(reportId) {
  const report = await IncidentReport.findOne({ reportId })
    .populate("bookingId", "bookingId pickupLocation destination status clientUserId driverUserId")
    .populate({ path: "clientId", select: "userId", populate: { path: "userId", select: "fullName firstName phone email" } })
    .populate({ path: "driverId", select: "userId publicDriverId", populate: { path: "userId", select: "fullName firstName phone email" } })
    .populate("assignedAdminId", "fullName email");
  if (!report) throw createHttpError("Incident report not found", 404);
  return report;
}

async function canUserAccessReport(user, report) {
  if (String(report.reportedByUserId) === String(user._id)) return true;
  const booking = report.bookingId;
  if (booking && user.role === "client" && booking.clientUserId && String(booking.clientUserId) === String(user._id)) return true;
  if (booking && user.role === "driver" && booking.driverUserId && String(booking.driverUserId) === String(user._id)) return true;
  return false;
}

async function listMyReports(user) {
  const or = [{ reportedByUserId: user._id }];
  if (user.role === "client") {
    const client = await ClientProfile.findOne({ userId: user._id }).select("_id");
    if (client) or.push({ clientId: client._id });
  }
  if (user.role === "driver") {
    const driver = await DriverProfile.findOne({ userId: user._id }).select("_id");
    if (driver) or.push({ driverId: driver._id });
  }
  const reports = await IncidentReport.find({ $or: or }).sort({ createdAt: -1 })
    .populate("bookingId", "bookingId pickupLocation destination status")
    .populate({ path: "clientId", select: "userId", populate: { path: "userId", select: "fullName firstName phone email" } })
    .populate({ path: "driverId", select: "userId publicDriverId", populate: { path: "userId", select: "fullName firstName phone email" } });
  return { reports: reports.map(function (report) { return safeReport(report, user.role); }) };
}

async function getReport(user, reportId) {
  const report = await findReportById(reportId);
  if (!(await canUserAccessReport(user, report))) throw createHttpError("Not authorized to view this report", 403);
  return { report: safeReport(report, user.role) };
}

async function addMessage(user, reportId, message) {
  if (!message) throw createHttpError("Message is required");
  const report = await findReportById(reportId);
  if (!(await canUserAccessReport(user, report))) throw createHttpError("Not authorized to update this report", 403);
  report.updates.push({ message, visibility: "public", createdBy: user._id, createdByRole: roleLabel(user) });
  report.lastUpdated = new Date();
  await report.save();
  return getReport(user, reportId);
}

async function addEvidence(user, reportId, file) {
  const report = await findReportById(reportId);
  if (!(await canUserAccessReport(user, report))) throw createHttpError("Not authorized to upload evidence for this report", 403);
  const filePath = path.join("uploads", "incident-evidence", file.filename).replace(/\\/g, "/");
  report.evidenceFiles.push({ fileName: file.originalname, fileUrl: filePath, mimeType: file.mimetype, uploadedAt: new Date() });
  report.lastUpdated = new Date();
  await report.save();
  return getReport(user, reportId);
}

function buildAdminFilter(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.urgency) filter.urgency = query.urgency;
  if (query.reportType) filter.reportType = query.reportType;
  if (query.clientId) filter.clientId = query.clientId;
  if (query.driverId) filter.driverId = query.driverId;
  if (query.bookingId) filter.bookingId = query.bookingId;
  if (query.assignedAdminId) filter.assignedAdminId = query.assignedAdminId;
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }
  if (query.search) filter.description = new RegExp(String(query.search), "i");
  return filter;
}

async function adminListReports(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const filter = buildAdminFilter(query);
  const [reports, total] = await Promise.all([
    IncidentReport.find(filter).sort({ urgency: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("bookingId", "bookingId pickupLocation destination status")
      .populate({ path: "clientId", select: "userId", populate: { path: "userId", select: "fullName firstName phone email" } })
      .populate({ path: "driverId", select: "userId publicDriverId", populate: { path: "userId", select: "fullName firstName phone email" } })
      .populate("assignedAdminId", "fullName email"),
    IncidentReport.countDocuments(filter)
  ]);
  return { reports: reports.map(function (report) { return safeReport(report, "admin"); }), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function adminGetReport(reportId) {
  const report = await findReportById(reportId);
  return { report: safeReport(report, "admin") };
}

async function audit(adminUser, action, report, description, metadata = {}) {
  await AdminAuditLog.create({ adminUserId: adminUser._id, action, targetType: "IncidentReport", targetId: String(report._id), description, metadata });
}

async function adminUpdateStatus(adminUser, reportId, status, note) {
  if (!REPORT_STATUSES.includes(status)) throw createHttpError("Invalid report status");
  if (!note) throw createHttpError("Admin status note is required");
  const report = await findReportById(reportId);
  if (!canTransitionReportStatus(report.status, status)) throw createHttpError("Invalid report status transition", 409);
  report.status = status;
  report.lastUpdated = new Date();
  if (status === "Resolved") report.resolvedAt = new Date();
  report.updates.push({ message: note, visibility: "admin", createdBy: adminUser._id, createdByRole: "Admin" });
  await report.save();
  await audit(adminUser, status === "Escalated" ? "ESCALATE_INCIDENT_REPORT" : status === "Resolved" ? "RESOLVE_INCIDENT_REPORT" : "UPDATE_INCIDENT_REPORT_STATUS", report, "Admin updated incident report status", { status, note });
  return adminGetReport(reportId);
}

async function adminAssignReport(adminUser, reportId, assignedAdminId) {
  if (!assignedAdminId) throw createHttpError("Assigned admin ID is required");
  const assignedAdmin = await User.findOne({ _id: assignedAdminId, role: "admin" });
  if (!assignedAdmin) throw createHttpError("Assigned admin not found", 404);
  const report = await findReportById(reportId);
  report.assignedAdminId = assignedAdmin._id;
  report.lastUpdated = new Date();
  await report.save();
  await audit(adminUser, "ASSIGN_INCIDENT_REPORT", report, "Admin assigned incident report", { assignedAdminId });
  return adminGetReport(reportId);
}

async function adminAddNote(adminUser, reportId, note) {
  if (!note) throw createHttpError("Admin note is required");
  const report = await findReportById(reportId);
  report.adminNotes = [report.adminNotes, note].filter(Boolean).join("\n\n");
  report.updates.push({ message: note, visibility: "admin", createdBy: adminUser._id, createdByRole: "Admin" });
  report.lastUpdated = new Date();
  await report.save();
  await audit(adminUser, "ADD_INCIDENT_REPORT_NOTE", report, "Admin added incident report note");
  return adminGetReport(reportId);
}

module.exports = {
  createReport,
  listMyReports,
  getReport,
  addMessage,
  addEvidence,
  adminListReports,
  adminGetReport,
  adminUpdateStatus,
  adminAssignReport,
  adminAddNote
};
