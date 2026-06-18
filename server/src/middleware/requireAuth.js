const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/apiResponse");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }
  return header.slice("Bearer ".length).trim();
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json(errorResponse("Token missing"));
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json(errorResponse("Token invalid"));
    }
    if (user.status === "suspended") {
      return res.status(403).json(errorResponse("Account suspended"));
    }
    if (user.status === "disabled") {
      return res.status(403).json(errorResponse("Account disabled"));
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json(errorResponse("Token invalid"));
  }
}

module.exports = requireAuth;
