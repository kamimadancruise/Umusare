const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

async function optionalAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return next();
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (user && user.status !== "suspended" && user.status !== "disabled") {
      req.user = user;
      req.auth = payload;
    }
  } catch (error) {
    // Guest-style booking still works when no valid token is present.
  }
  return next();
}

module.exports = optionalAuth;
