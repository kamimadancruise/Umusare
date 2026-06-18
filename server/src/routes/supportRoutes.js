const express = require("express");
const { successResponse } = require("../utils/apiResponse");
const contactService = require("../services/contactService");

const router = express.Router();

router.get("/", function supportPlaceholder(req, res) {
  res.json(successResponse("Support routes placeholder. Implementation coming later."));
});

router.get("/contact", function supportContact(req, res) {
  res.json(successResponse("Umusare support contact loaded", {
    contactActions: contactService.getPublicSupportContactActions()
  }));
});

module.exports = router;
