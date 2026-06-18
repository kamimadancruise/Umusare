const jwt = require("jsonwebtoken");
const env = require("../config/env");

function assertJwtSecret() {
  if (!env.jwtSecret) {
    const error = new Error("JWT_SECRET is not configured.");
    error.statusCode = 500;
    throw error;
  }
}

function signToken(user) {
  assertJwtSecret();
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifyToken(token) {
  assertJwtSecret();
  return jwt.verify(token, env.jwtSecret);
}

module.exports = {
  signToken,
  verifyToken
};
