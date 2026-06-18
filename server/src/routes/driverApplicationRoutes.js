const express = require("express");
const driverApplicationController = require("../controllers/driverApplicationController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const validateRequest = require("../middleware/validateRequest");
const { uploadDriverDocument } = require("../middleware/upload");
const { uploadLimiter } = require("../middleware/rateLimit");
const { validateDriverApplication, validateDriverApplicationUpdate } = require("../validators/driverApplicationValidators");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("driver"));

router.post("/", validateRequest(validateDriverApplication), driverApplicationController.createApplication);
router.get("/me", driverApplicationController.getMyApplication);
router.patch("/me", validateRequest(validateDriverApplicationUpdate), driverApplicationController.updateMyApplication);
router.delete("/me", driverApplicationController.withdrawMyApplication);

router.post(
  "/:applicationId/documents",
  uploadLimiter,
  uploadDriverDocument.single("document"),
  driverApplicationController.uploadDocument
);
router.get("/:applicationId/documents", driverApplicationController.getDocuments);

module.exports = router;
