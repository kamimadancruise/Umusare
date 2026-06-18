const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  appEnv: process.env.APP_ENV || process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  dnsServers: (process.env.DNS_SERVERS || "")
    .split(",")
    .map(function (server) { return server.trim(); })
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  adminUrl: process.env.ADMIN_URL || "http://localhost:3001",
  apiUrl: process.env.API_URL || "http://localhost:5000",
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(function (origin) { return origin.trim(); })
    .filter(Boolean),
  uploadStorage: process.env.UPLOAD_STORAGE || "local",
  privateUploadsDir: process.env.PRIVATE_UPLOADS_DIR || "",
  cloudStorageBucket: process.env.CLOUD_STORAGE_BUCKET || "",
  cloudStorageRegion: process.env.CLOUD_STORAGE_REGION || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  appleClientId: process.env.APPLE_CLIENT_ID || "",
  appleTeamId: process.env.APPLE_TEAM_ID || "",
  appleKeyId: process.env.APPLE_KEY_ID || "",
  applePrivateKey: process.env.APPLE_PRIVATE_KEY || "",
  supportPhone: process.env.SUPPORT_PHONE || "+250788000222",
  supportWhatsApp: process.env.SUPPORT_WHATSAPP || process.env.SUPPORT_PHONE || "+250788000222",
  supportEmail: process.env.SUPPORT_EMAIL || "support@umusare.rw",
  testModeEnabled: process.env.ENABLE_TEST_MODE === "true",
  demoDataEnabled: process.env.ENABLE_DEMO_DATA === "true",
  dummyPaymentsEnabled: process.env.ENABLE_DUMMY_PAYMENTS === "true" || process.env.DUMMY_PAYMENTS_ENABLED === "true",
  realPaymentsEnabled: process.env.ENABLE_REAL_PAYMENTS === "true",
  paymentProvider: process.env.PAYMENT_PROVIDER || "",
  paymentEnv: process.env.PAYMENT_ENV || "sandbox",
  momoApiBaseUrl: process.env.MOMO_API_BASE_URL || "",
  momoApiKey: process.env.MOMO_API_KEY || "",
  momoApiSecret: process.env.MOMO_API_SECRET || "",
  momoMerchantId: process.env.MOMO_MERCHANT_ID || "",
  momoCallbackUrl: process.env.MOMO_CALLBACK_URL || "",
  momoCurrency: process.env.MOMO_CURRENCY || "RWF"
};

env.isProduction = env.appEnv === "production" || (!process.env.APP_ENV && env.nodeEnv === "production");
if (env.isProduction) {
  env.testModeEnabled = false;
  env.demoDataEnabled = false;
  env.dummyPaymentsEnabled = false;
}

function isLocalUrl(value) {
  return /localhost|127\.0\.0\.1|file:/.test(String(value || ""));
}

function validateProductionEnvironment() {
  if (!env.isProduction) return;

  const errors = [];
  const weakJwtSecrets = new Set(["secret", "changeme", "change-this-secret", "development-secret"]);

  if (!env.databaseUrl) errors.push("DATABASE_URL is required in production.");
  if (!env.jwtSecret) errors.push("JWT_SECRET is required in production.");
  if (weakJwtSecrets.has(String(env.jwtSecret).toLowerCase()) || String(env.jwtSecret).length < 32) {
    errors.push("JWT_SECRET must be strong and at least 32 characters in production.");
  }
  if (!env.frontendUrl || isLocalUrl(env.frontendUrl)) errors.push("FRONTEND_URL must be the real public website origin in production.");
  if (!env.adminUrl || isLocalUrl(env.adminUrl)) errors.push("ADMIN_URL must be the real admin portal origin in production.");
  if (env.corsOrigins.includes("*")) errors.push("CORS_ORIGINS must not contain wildcard origins in production.");
  if (process.env.ENABLE_TEST_MODE === "true") errors.push("ENABLE_TEST_MODE must be false in production.");
  if (process.env.ENABLE_DEMO_DATA === "true") errors.push("ENABLE_DEMO_DATA must be false in production.");
  if (process.env.ENABLE_DUMMY_PAYMENTS === "true" || process.env.DUMMY_PAYMENTS_ENABLED === "true") {
    errors.push("ENABLE_DUMMY_PAYMENTS must be false in production.");
  }
  if (env.realPaymentsEnabled) {
    const paymentMissing = [
      ["PAYMENT_PROVIDER", env.paymentProvider],
      ["PAYMENT_ENV", env.paymentEnv],
      ["MOMO_API_BASE_URL", env.momoApiBaseUrl],
      ["MOMO_API_KEY", env.momoApiKey],
      ["MOMO_API_SECRET", env.momoApiSecret],
      ["MOMO_CALLBACK_URL", env.momoCallbackUrl],
      ["MOMO_CURRENCY", env.momoCurrency]
    ].filter(function (item) { return !item[1]; }).map(function (item) { return item[0]; });
    if (paymentMissing.length) {
      errors.push("Real payments are enabled but payment provider configuration is incomplete: " + paymentMissing.join(", ") + ".");
    }
  }

  if (errors.length) {
    throw new Error("Unsafe Umusare production configuration:\n- " + errors.join("\n- "));
  }
}

validateProductionEnvironment();

module.exports = env;
