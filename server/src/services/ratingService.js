const Review = require("../models/Review");
const DriverProfile = require("../models/DriverProfile");

async function recalculateDriverRating(driverId) {
  const summary = await Review.aggregate([
    { $match: { driverId } },
    {
      $group: {
        _id: "$driverId",
        average: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  const ratingSummary = summary[0] || { average: 0, reviewCount: 0 };
  const ratingAverage = Math.round(Number(ratingSummary.average || 0) * 10) / 10;
  const reviewCount = Number(ratingSummary.reviewCount || 0);
  await DriverProfile.findByIdAndUpdate(driverId, { ratingAverage, reviewCount });
  return { ratingAverage, reviewCount, lowRatingWarning: ratingAverage > 0 && ratingAverage < 3.5 };
}

async function getDriverRatingSummary(driverId) {
  const driver = await DriverProfile.findById(driverId).select("ratingAverage reviewCount completedTrips");
  if (!driver) return { ratingAverage: 0, reviewCount: 0, completedTrips: 0, lowRatingWarning: false };
  return {
    ratingAverage: driver.ratingAverage,
    reviewCount: driver.reviewCount,
    completedTrips: driver.completedTrips,
    lowRatingWarning: driver.ratingAverage > 0 && driver.ratingAverage < 3.5
  };
}

module.exports = {
  recalculateDriverRating,
  getDriverRatingSummary
};
