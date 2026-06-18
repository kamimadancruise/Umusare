const express = require("express");
const { successResponse } = require("../utils/apiResponse");

const router = express.Router();

router.get("/", function clientPlaceholder(req, res) {
  res.json(successResponse("Client routes placeholder. Implementation coming later."));
});

module.exports = router;
