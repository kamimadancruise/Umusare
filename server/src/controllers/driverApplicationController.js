const driverApplicationService = require("../services/driverApplicationService");
const { successResponse } = require("../utils/apiResponse");

async function createApplication(req, res, next) {
  try {
    const result = await driverApplicationService.createApplication(req.user, req.body);
    res.status(201).json(successResponse("Driver application submitted successfully", result));
  } catch (error) {
    next(error);
  }
}

async function getMyApplication(req, res, next) {
  try {
    const result = await driverApplicationService.getCurrentApplication(req.user);
    res.json(successResponse("Driver application loaded", result));
  } catch (error) {
    next(error);
  }
}

async function updateMyApplication(req, res, next) {
  try {
    const result = await driverApplicationService.updateCurrentApplication(req.user, req.body);
    res.json(successResponse("Driver application updated", result));
  } catch (error) {
    next(error);
  }
}

async function withdrawMyApplication(req, res, next) {
  try {
    const result = await driverApplicationService.withdrawCurrentApplication(req.user);
    res.json(successResponse("Driver application withdrawn", result));
  } catch (error) {
    next(error);
  }
}

async function uploadDocument(req, res, next) {
  try {
    const result = await driverApplicationService.uploadDocument(
      req.user,
      req.params.applicationId,
      req.body.documentType || req.query.documentType,
      req.file
    );
    res.status(201).json(successResponse("Driver document uploaded successfully", result));
  } catch (error) {
    next(error);
  }
}

async function getDocuments(req, res, next) {
  try {
    const result = await driverApplicationService.getApplicationDocuments(req.user, req.params.applicationId);
    res.json(successResponse("Driver document statuses loaded", result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createApplication,
  getMyApplication,
  updateMyApplication,
  withdrawMyApplication,
  uploadDocument,
  getDocuments
};
