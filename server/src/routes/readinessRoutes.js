const express = require("express");
const mongoose = require("mongoose");
const env = require("../config/env");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const router = express.Router();

router.get("/", function readinessCheck(req, res) {
  const isDatabaseReady = mongoose.connection.readyState === 1;
  const isReady = env.isProduction ? isDatabaseReady : true;

  const payload = {
    appName: "Umusare",
    environment: env.appEnv,
    status: isReady ? "ready" : "not ready",
    database: isDatabaseReady ? "connected" : "not connected",
    timestamp: new Date().toISOString()
  };

  if (!isReady) {
    return res.status(503).json(errorResponse("Umusare backend is not ready", [payload]));
  }

  return res.json(successResponse("Umusare backend is ready", payload));
});

module.exports = router;
