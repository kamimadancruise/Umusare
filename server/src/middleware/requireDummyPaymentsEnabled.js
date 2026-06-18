const env = require("../config/env");

function requireDummyPaymentsEnabled(req, res, next) {
  if (!env.dummyPaymentsEnabled) {
    return res.status(403).json({
      success: false,
      message: "Dummy payments are disabled in this environment.",
      errors: []
    });
  }
  return next();
}

module.exports = requireDummyPaymentsEnabled;
