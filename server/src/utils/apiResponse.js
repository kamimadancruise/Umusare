function successResponse(message, data = {}) {
  return {
    success: true,
    message,
    data
  };
}

function errorResponse(message, errors = []) {
  return {
    success: false,
    message,
    errors
  };
}

module.exports = {
  successResponse,
  errorResponse
};
