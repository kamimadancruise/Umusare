const { errorResponse } = require("../utils/apiResponse");

const buckets = new Map();

function getClientKey(req, scope) {
  return [
    scope,
    req.ip,
    req.headers["x-forwarded-for"] || "",
    req.method,
    req.originalUrl.split("?")[0]
  ].join(":");
}

function rateLimit(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const scope = options.scope || "general";
  const message = options.message || "Too many requests. Please try again later.";

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = getClientKey(req, scope);
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > max) {
      res.setHeader("Retry-After", Math.ceil((existing.resetAt - now) / 1000));
      return res.status(429).json(errorResponse(message));
    }

    return next();
  };
}

function pruneRateLimitBuckets() {
  const now = Date.now();
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}

setInterval(pruneRateLimitBuckets, 10 * 60 * 1000).unref();

module.exports = {
  rateLimit,
  generalApiLimiter: rateLimit({ scope: "api", windowMs: 15 * 60 * 1000, max: 300 }),
  authLimiter: rateLimit({ scope: "auth", windowMs: 15 * 60 * 1000, max: 20 }),
  forgotPasswordLimiter: rateLimit({ scope: "forgot-password", windowMs: 60 * 60 * 1000, max: 5 }),
  uploadLimiter: rateLimit({ scope: "upload", windowMs: 15 * 60 * 1000, max: 30 })
};
