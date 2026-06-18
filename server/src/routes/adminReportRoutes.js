const express = require("express");
const adminReportController = require("../controllers/adminReportController");

const router = express.Router();

router.get("/", adminReportController.listReports);
router.get("/:reportId", adminReportController.getReport);
router.patch("/:reportId/status", adminReportController.updateStatus);
router.patch("/:reportId/assign", adminReportController.assignReport);
router.patch("/:reportId/add-note", adminReportController.addNote);

module.exports = router;
