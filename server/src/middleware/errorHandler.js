const { errorResponse } = require("../utils/apiResponse");
const env = require("../config/env");

function errorHandler(error, req, res, next) {
  const isUploadError = error.name === "MulterError" || /Only PDF, JPG, JPEG, and PNG/.test(error.message || "");
  const statusCode = error.statusCode || error.status || (isUploadError ? 400 : 500);
  const payload = errorResponse(
    statusCode === 500 ? "Internal server error" : error.message,
    error.errors || (env.nodeEnv === "development" ? [{ message: error.message, stack: error.stack }] : [])
  );

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
