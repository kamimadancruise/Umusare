const Review = require("../models/Review");

async function generateReviewId() {
  const count = await Review.countDocuments();
  return "UMA-REV-" + String(count + 1).padStart(6, "0");
}

module.exports = generateReviewId;
