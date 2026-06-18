const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const apiRoutes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { generalApiLimiter } = require("./middleware/rateLimit");

const app = express();

const localDevOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5500",
  "http://localhost:5501",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501"
];
const allowedOrigins = Array.from(new Set([
  env.frontendUrl,
  env.adminUrl
].concat(env.appEnv === "development" ? localDevOrigins : [], env.corsOrigins || []).filter(Boolean)));

app.use(helmet());
app.use(cors({
  origin: function checkOrigin(origin, callback) {
    if (env.isProduction && allowedOrigins.includes("*")) {
      return callback(new Error("Wildcard CORS origin is not allowed in production"));
    }
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
}

// Public website will later call http://localhost:5000/api.
// Admin portal will later call http://localhost:5000/api/admin.
app.use("/api", generalApiLimiter);
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
