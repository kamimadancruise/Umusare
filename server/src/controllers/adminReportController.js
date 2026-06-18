const reportService = require("../services/reportService");
const { successResponse } = require("../utils/apiResponse");

async function listReports(req, res, next) {
  try {
    const result = await reportService.adminListReports(req.query);
    res.json(successResponse("Admin incident reports loaded", result));
  } catch (error) {
    next(error);
  }
}

async function getReport(req, res, next) {
  try {
    const result = await reportService.adminGetReport(req.params.reportId);
    res.json(successResponse("Admin incident report loaded", result));
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const result = await reportService.adminUpdateStatus(req.user, req.params.reportId, req.body.status, req.body.note);
    res.json(successResponse("Incident report status updated", result));
  } catch (error) {
    next(error);
  }
}

async function assignReport(req, res, next) {
  try {
    const result = await reportService.adminAssignReport(req.user, req.params.reportId, req.body.assignedAdminId);
    res.json(successResponse("Incident report assigned", result));
  } catch (error) {
    next(error);
  }
}

async function addNote(req, res, next) {
  try {
    const result = await reportService.adminAddNote(req.user, req.params.reportId, req.body.note);
    res.json(successResponse("Incident report note added", result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listReports,
  getReport,
  updateStatus,
  assignReport,
  addNote
};
