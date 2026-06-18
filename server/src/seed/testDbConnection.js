require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../config/env");
const connectDB = require("../config/db");

async function testDbConnection() {
  try {
    const info = connectDB.safeDatabaseInfo(env.databaseUrl);
    console.log("DATABASE_URL present:", info.present ? "yes" : "no");
    console.log("JWT_SECRET present:", env.jwtSecret ? "yes" : "no");
    console.log("DATABASE_URL type:", info.type);
    console.log("MongoDB host:", info.host);
    console.log("DNS override enabled:", env.dnsServers && env.dnsServers.length ? "yes" : "no");

    if (!env.databaseUrl) {
      throw new Error("DATABASE_URL is missing. Add it to server/.env before testing MongoDB.");
    }

    const connection = await connectDB();
    if (!connection) {
      throw new Error("MongoDB connection was not established.");
    }

    console.log("MongoDB test connection: success");
    console.log("Connected database:", connection.connection.name || "unknown");
  } catch (error) {
    console.error("MongoDB test connection: failed");
    console.error("Reason:", error.message);
    if (/querySrv\s+ECONNREFUSED/i.test(error.message || "")) {
      console.error("MongoDB SRV lookup failed. Try using a different internet network/hotspot, or change DNS settings, or use a standard non-SRV MongoDB connection string from Atlas.");
    }
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect cleanup errors for this read-only test.
    }
  }
}

testDbConnection();
