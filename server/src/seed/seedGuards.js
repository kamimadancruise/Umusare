const mongoose = require("mongoose");
const env = require("../config/env");
const connectDB = require("../config/db");

function assertNotProduction(scriptName) {
  if (env.isProduction) {
    throw new Error(scriptName + " refused to run because APP_ENV or NODE_ENV is production.");
  }
}

function assertDemoDataEnabled(scriptName) {
  assertNotProduction(scriptName);
  if (!env.demoDataEnabled) {
    throw new Error(scriptName + " requires ENABLE_DEMO_DATA=true.");
  }
}

async function runSeed(scriptName, runner) {
  try {
    assertNotProduction(scriptName);
    if (!env.databaseUrl) {
      throw new Error("DATABASE_URL is missing. Add it to server/.env before running seed scripts.");
    }
    const connection = await connectDB();
    if (!connection) {
      throw new Error("MongoDB connection was not established. Check DATABASE_URL and Atlas network access.");
    }
    await runner();
    await mongoose.disconnect();
    console.log(scriptName + " completed.");
  } catch (error) {
    console.error(scriptName + " failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect cleanup errors in seed scripts.
    }
    process.exitCode = 1;
  }
}

module.exports = {
  assertNotProduction,
  assertDemoDataEnabled,
  runSeed
};
