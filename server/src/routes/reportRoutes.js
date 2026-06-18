const express = require("express");
const reportController = require("../controllers/reportController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { uploadIncidentEvidence } = require("../middleware/upload");
const { uploadLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/", requireAuth, requireRole("client", "driver"), reportController.createReport);
router.get("/me", requireAuth, reportController.listMyReports);
router.get("/:reportId", requireAuth, reportController.getReport);
router.patch("/:reportId/add-message", requireAuth, reportController.addMessage);
router.post("/:reportId/evidence", requireAuth, uploadLimiter, uploadIncidentEvidence.single("evidence"), reportController.addEvidence);

module.exports = router;
