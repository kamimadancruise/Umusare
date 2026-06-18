const express = require("express");
const env = require("../config/env");

const router = express.Router();

router.get("/", function healthCheck(req, res) {
  res.json({
    success: true,
    status: "ok",
    appName: "Umusare",
    message: "Umusare backend is running",
    environment: env.appEnv,
    nodeEnvironment: env.nodeEnv,
    testMode: env.testModeEnabled,
    dummyPayments: env.dummyPaymentsEnabled,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
