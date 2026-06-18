const express = require("express");
const adminDriverApplicationController = require("../controllers/adminDriverApplicationController");

const router = express.Router();

router.get("/", adminDriverApplicationController.listApplications);
router.get("/:applicationId", adminDriverApplicationController.getApplicationDetail);
router.patch("/:applicationId/status", adminDriverApplicationController.updateApplicationStatus);
router.patch("/:applicationId/documents/:documentId/verify", adminDriverApplicationController.verifyDocument);
router.patch("/:applicationId/documents/:documentId/reject", adminDriverApplicationController.rejectDocument);
router.patch("/:applicationId/documents/:documentId/needs-review", adminDriverApplicationController.markDocumentNeedsReview);
router.get("/:applicationId/documents/:documentId/view", adminDriverApplicationController.viewDocument);

module.exports = router;
