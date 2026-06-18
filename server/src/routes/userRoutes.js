const express = require("express");
const { successResponse } = require("../utils/apiResponse");

const router = express.Router();

router.get("/", function userPlaceholder(req, res) {
  res.json(successResponse("User routes placeholder. Implementation coming later."));
});

module.exports = router;
