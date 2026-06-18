const { errorResponse } = require("../utils/apiResponse");

function normalizeAllowedRoles(roles) {
  return Array.isArray(roles) ? roles : Array.from(arguments);
}

function requireRole() {
  const allowedRoles = normalizeAllowedRoles.apply(null, arguments);

  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json(errorResponse("Not authorized"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse("Role not allowed"));
    }
    return next();
  };
}

module.exports = requireRole;
