const express = require("express");
const authController = require("../controllers/authController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { authLimiter, forgotPasswordLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/google", authLimiter, authController.googleLogin);
router.post("/apple", authLimiter, authController.appleLogin);
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);
router.post("/reset-password", forgotPasswordLimiter, authController.resetPassword);
router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);

// Test routes for local authentication checks only.
router.get("/protected", requireAuth, authController.protectedRoute);
router.get("/admin-only", requireAuth, requireRole("admin"), authController.adminOnly);

module.exports = router;
