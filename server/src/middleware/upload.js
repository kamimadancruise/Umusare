const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "..", "..", "uploads", "driver-documents");
const incidentEvidenceRoot = path.join(__dirname, "..", "..", "uploads", "incident-evidence");
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png"]);
const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

fs.mkdirSync(uploadRoot, { recursive: true });
fs.mkdirSync(incidentEvidenceRoot, { recursive: true });

function sanitizeFileName(fileName) {
  const parsed = path.parse(fileName);
  const safeBase = parsed.name.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 80) || "document";
  const safeExt = parsed.ext.toLowerCase();
  return safeBase + safeExt;
}

const storage = multer.diskStorage({
  destination: function destination(req, file, callback) {
    callback(null, uploadRoot);
  },
  filename: function filename(req, file, callback) {
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, uniquePrefix + "-" + sanitizeFileName(file.originalname));
  }
});

const incidentStorage = multer.diskStorage({
  destination: function destination(req, file, callback) {
    callback(null, incidentEvidenceRoot);
  },
  filename: function filename(req, file, callback) {
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, uniquePrefix + "-" + sanitizeFileName(file.originalname));
  }
});

function fileFilter(req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
    return callback(new Error("Only PDF, JPG, JPEG, and PNG files are allowed."));
  }
  return callback(null, true);
}

// Before production, move document storage to secure private cloud storage and use signed URLs for admin-only access.
const uploadDriverDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Before production, move incident evidence to secure private cloud storage and use signed URLs for authorized access.
const uploadIncidentEvidence = multer({
  storage: incidentStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  uploadDriverDocument,
  uploadIncidentEvidence,
  uploadRoot,
  incidentEvidenceRoot
};
