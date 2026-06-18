const mongoose = require("mongoose");
const dns = require("dns");
const env = require("./env");

let dnsOverrideApplied = false;

function applyDnsOverride() {
  if (!env.dnsServers || !env.dnsServers.length || dnsOverrideApplied) {
    return dnsOverrideApplied;
  }
  dns.setServers(env.dnsServers);
  dnsOverrideApplied = true;
  return true;
}

function safeDatabaseInfo(databaseUrl) {
  const info = {
    present: Boolean(databaseUrl),
    type: "missing",
    host: "not configured"
  };

  if (!databaseUrl) return info;

  info.type = databaseUrl.startsWith("mongodb+srv://")
    ? "mongodb+srv"
    : databaseUrl.startsWith("mongodb://")
      ? "mongodb"
      : "unknown";

  try {
    const withoutProtocol = databaseUrl.replace(/^mongodb(\+srv)?:\/\//, "");
    const withoutAuth = withoutProtocol.includes("@")
      ? withoutProtocol.split("@").slice(1).join("@")
      : withoutProtocol;
    info.host = withoutAuth.split("/")[0].split("?")[0];
  } catch (error) {
    info.host = "unavailable";
  }

  return info;
}

function logSafeDatabaseDebug(databaseUrl) {
  if (env.nodeEnv !== "development") return;
  const info = safeDatabaseInfo(databaseUrl);
  console.log("DATABASE_URL present:", info.present ? "yes" : "no");
  console.log("JWT_SECRET present:", env.jwtSecret ? "yes" : "no");
  console.log("DATABASE_URL type:", info.type);
  console.log("MongoDB host:", info.host);
  console.log("DNS override enabled:", env.dnsServers && env.dnsServers.length ? "yes" : "no");
}

async function connectDB() {
  if (!env.databaseUrl) {
    if (env.nodeEnv === "development") {
      logSafeDatabaseDebug(env.databaseUrl);
      console.log("DATABASE_URL is not set. Skipping MongoDB connection for now.");
    }
    return null;
  }

  logSafeDatabaseDebug(env.databaseUrl);
  applyDnsOverride();

  try {
    const connection = await mongoose.connect(env.databaseUrl, {
      serverSelectionTimeoutMS: 15000
    });
    if (env.nodeEnv === "development") {
      console.log("MongoDB connected:", connection.connection.host);
    }
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (/querySrv\s+ECONNREFUSED/i.test(error.message || "")) {
      console.error("MongoDB SRV lookup failed. Try using a different internet network/hotspot, or change DNS settings, or use a standard non-SRV MongoDB connection string from Atlas.");
    }
    throw error;
  }
}

connectDB.safeDatabaseInfo = safeDatabaseInfo;
connectDB.logSafeDatabaseDebug = logSafeDatabaseDebug;
connectDB.applyDnsOverride = applyDnsOverride;

module.exports = connectDB;
