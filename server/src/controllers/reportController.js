const reportService = require("../services/reportService");
const { successResponse } = require("../utils/apiResponse");

async function createReport(req, res, next) {
  try {
    const result = await reportService.createReport(req.user, req.body);
    res.status(201).json(successResponse("Incident report submitted", result));
  } catch (error) {
    next(error);
  }
}

async function listMyReports(req, res, next) {
  try {
    const result = await reportService.listMyReports(req.user);
    res.json(successResponse("Incident reports loaded", result));
  } catch (error) {
    next(error);
  }
}

async function getReport(req, res, next) {
  try {
    const result = await reportService.getReport(req.user, req.params.reportId);
    res.json(successResponse("Incident report loaded", result));
  } catch (error) {
    next(error);
  }
}

async function addMessage(req, res, next) {
  try {
    const result = await reportService.addMessage(req.user, req.params.reportId, req.body.message);
    res.json(successResponse("Report message added", result));
  } catch (error) {
    next(error);
  }
}

async function addEvidence(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error("Evidence file is required");
      error.statusCode = 400;
      throw error;
    }
    const result = await reportService.addEvidence(req.user, req.params.reportId, req.file);
    res.json(successResponse("Evidence uploaded", result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport,
  listMyReports,
  getReport,
  addMessage,
  addEvidence
};
