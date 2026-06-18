const express = require("express");
const { successResponse } = require("../utils/apiResponse");

const router = express.Router();

router.get("/", function analyticsPlaceholder(req, res) {
  res.json(successResponse("Analytics routes placeholder. Implementation coming later."));
});

module.exports = router;
