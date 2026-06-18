const { errorResponse } = require("../utils/apiResponse");

function notFound(req, res) {
  res.status(404).json(errorResponse("Route not found", [
    {
      method: req.method,
      path: req.originalUrl
    }
  ]));
}

module.exports = notFound;
