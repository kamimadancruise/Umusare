const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const env = require("../config/env");
const { signToken } = require("../utils/jwt");

const PUBLIC_ROLES = ["client", "driver"];
const MIN_PASSWORD_LENGTH = 8;

function createHttpError(message, statusCode = 400, errors = []) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
}

function ensureDatabaseReady() {
  if (mongoose.connection.readyState !== 1) {
    throw createHttpError("Database is not connected. Start MongoDB and set DATABASE_URL before logging in.", 503);
  }
}

function safeRole(role) {
  return PUBLIC_ROLES.includes(role) ? role : "client";
}

function splitName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ")
  };
}

function normalizeEmail(email) {
  return email ? String(email).trim().toLowerCase() : "";
}

function normalizePhone(phone) {
  return phone ? String(phone).trim() : "";
}

function serializeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    authProvider: user.authProvider,
    status: user.status,
    profilePhoto: user.profilePhoto,
    city: user.city,
    createdAt: user.createdAt
  };
}

function ensureAccountCanLogin(user) {
  if (!user) {
    throw createHttpError("Invalid credentials", 401);
  }
  if (user.status === "suspended") {
    throw createHttpError("Account suspended", 403);
  }
  if (user.status === "disabled") {
    throw createHttpError("Account disabled", 403);
  }
}

function buildAuthPayload(user, message) {
  return {
    message,
    user: serializeUser(user),
    role: user.role,
    token: signToken(user)
  };
}

async function registerLocalUser(input) {
  ensureDatabaseReady();
  const fullName = String(input.fullName || "").trim();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const password = String(input.password || "");
  const role = input.role;

  if (!fullName) {
    throw createHttpError("Full name is required");
  }
  if (!email && !phone) {
    throw createHttpError("Email or phone is required");
  }
  if (!PUBLIC_ROLES.includes(role)) {
    // Admin users should be created by a seed script or manually by the platform owner before launch.
    throw createHttpError("Public registration is only available for client or driver accounts", 403);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError("Password must be at least 8 characters long");
  }

  const existingUser = await User.findOne({
    $or: [email ? { email } : null, phone ? { phone } : null].filter(Boolean)
  });
  if (existingUser) {
    throw createHttpError("An account with this email or phone already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const nameParts = splitName(fullName);
  const user = await User.create({
    fullName,
    firstName: input.firstName || nameParts.firstName,
    lastName: input.lastName || nameParts.lastName,
    email: email || undefined,
    phone: phone || undefined,
    passwordHash,
    authProvider: "local",
    role,
    status: role === "driver" ? "pending" : "active",
    city: input.city
  });

  return buildAuthPayload(user, "Umusare account registered successfully");
}

async function loginLocalUser(input) {
  ensureDatabaseReady();
  const identifier = String(input.identifier || "").trim();
  const password = String(input.password || "");
  if (!identifier || !password) {
    throw createHttpError("Identifier and password are required");
  }

  const normalizedIdentifier = identifier.includes("@") ? identifier.toLowerCase() : identifier;
  const user = await User.findOne({
    $or: [{ email: normalizedIdentifier }, { phone: normalizedIdentifier }]
  });

  ensureAccountCanLogin(user);

  if (!user.passwordHash) {
    throw createHttpError("Use your social login provider for this account", 400);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw createHttpError("Invalid credentials", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return buildAuthPayload(user, "Logged in successfully");
}

async function loginWithGoogle(input) {
  ensureDatabaseReady();
  const idToken = input.idToken;
  if (!idToken) {
    throw createHttpError("Google ID token is required");
  }
  if (!env.googleClientId) {
    throw createHttpError("Google login is not configured for this Umusare environment yet", 501);
  }

  const client = new OAuth2Client(env.googleClientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.googleClientId
  });
  const payload = ticket.getPayload();
  const googleId = payload.sub;
  const email = normalizeEmail(payload.email);
  const fullName = payload.name || email || "Umusare Client";
  const nameParts = splitName(fullName);

  let user = await User.findOne({
    $or: [googleId ? { googleId } : null, email ? { email } : null].filter(Boolean)
  });

  if (user) {
    user.googleId = user.googleId || googleId;
    user.authProvider = user.authProvider || "google";
    user.lastLoginAt = new Date();
    await user.save();
  } else {
    user = await User.create({
      fullName,
      firstName: payload.given_name || nameParts.firstName,
      lastName: payload.family_name || nameParts.lastName,
      email: email || undefined,
      googleId,
      authProvider: "google",
      role: safeRole(input.role),
      status: "active",
      profilePhoto: payload.picture
    });
  }

  ensureAccountCanLogin(user);
  return buildAuthPayload(user, "Logged in with Google successfully");
}

async function loginWithApple(input) {
  ensureDatabaseReady();
  if (!input.identityToken) {
    throw createHttpError("Apple identity token is required");
  }
  if (!env.appleClientId || !env.appleTeamId || !env.appleKeyId || !env.applePrivateKey) {
    throw createHttpError("Apple login is not configured for this Umusare environment yet", 501);
  }

  // Apple token verification will be implemented with Apple's public keys in a later OAuth hardening step.
  throw createHttpError("Apple login verification is prepared but not implemented yet", 501);
}

async function getCurrentUser(userId) {
  ensureDatabaseReady();
  const user = await User.findById(userId);
  ensureAccountCanLogin(user);
  return serializeUser(user);
}

async function forgotPassword(input) {
  if (!input.email && !input.phone) {
    throw createHttpError("Email or phone is required");
  }
  return {
    message: "If this account exists, reset instructions will be sent."
  };
}

async function resetPassword() {
  return {
    message: "Password reset placeholder. Token verification and delivery will be implemented later."
  };
}

module.exports = {
  registerLocalUser,
  loginLocalUser,
  loginWithGoogle,
  loginWithApple,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  serializeUser
};
