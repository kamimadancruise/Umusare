const adminDriverApplicationService = require("../services/adminDriverApplicationService");
const { successResponse } = require("../utils/apiResponse");

async function listApplications(req, res, next) {
  try {
    const result = await adminDriverApplicationService.listApplications(req.query);
    res.json(successResponse("Driver applications loaded", result));
  } catch (error) {
    next(error);
  }
}

async function getApplicationDetail(req, res, next) {
  try {
    const result = await adminDriverApplicationService.getApplicationDetail(req.params.applicationId);
    res.json(successResponse("Driver application detail loaded", result));
  } catch (error) {
    next(error);
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const result = await adminDriverApplicationService.updateApplicationStatus(req.user, req.params.applicationId, req.body);
    res.json(successResponse("Driver application status updated", result));
  } catch (error) {
    next(error);
  }
}

async function verifyDocument(req, res, next) {
  try {
    const document = await adminDriverApplicationService.setDocumentStatus(req.user, req.params.applicationId, req.params.documentId, "Verified");
    res.json(successResponse("Document verified", { document }));
  } catch (error) {
    next(error);
  }
}

async function rejectDocument(req, res, next) {
  try {
    const document = await adminDriverApplicationService.setDocumentStatus(req.user, req.params.applicationId, req.params.documentId, "Rejected", req.body.rejectionReason);
    res.json(successResponse("Document rejected", { document }));
  } catch (error) {
    next(error);
  }
}

async function markDocumentNeedsReview(req, res, next) {
  try {
    const document = await adminDriverApplicationService.setDocumentStatus(req.user, req.params.applicationId, req.params.documentId, "Needs Review");
    res.json(successResponse("Document marked as needs review", { document }));
  } catch (error) {
    next(error);
  }
}

async function viewDocument(req, res, next) {
  try {
    const document = await adminDriverApplicationService.viewDocumentMetadata(req.params.applicationId, req.params.documentId);
    res.json(successResponse("Protected document metadata loaded", { document }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listApplications,
  getApplicationDetail,
  updateApplicationStatus,
  verifyDocument,
  rejectDocument,
  markDocumentNeedsReview,
  viewDocument
};
