const driverService = require("../services/driverService");
const reviewService = require("../services/reviewService");
const { successResponse } = require("../utils/apiResponse");

async function listPublicDrivers(req, res, next) {
  try {
    const result = await driverService.listPublicDrivers(req.query);
    res.json(successResponse("Public drivers loaded", result));
  } catch (error) {
    next(error);
  }
}

async function getOwnProfile(req, res, next) {
  try {
    const result = await driverService.getOwnProfile(req.user);
    res.json(successResponse("Driver profile loaded", result));
  } catch (error) {
    next(error);
  }
}

async function updateOwnProfile(req, res, next) {
  try {
    const result = await driverService.updateOwnProfile(req.user, req.body);
    res.json(successResponse("Driver profile updated", result));
  } catch (error) {
    next(error);
  }
}

async function updateOwnAvailability(req, res, next) {
  try {
    const result = await driverService.updateOwnAvailability(req.user, req.body);
    res.json(successResponse(result.message, {
      availability: result.availability,
      availableLater: result.availableLater
    }));
  } catch (error) {
    next(error);
  }
}

async function getPublicDriver(req, res, next) {
  try {
    const result = await driverService.getPublicDriver(req.params.publicDriverId);
    res.json(successResponse("Public driver profile loaded", result));
  } catch (error) {
    next(error);
  }
}

async function getOwnReviews(req, res, next) {
  try {
    const result = await reviewService.listDriverReviews(req.user);
    res.json(successResponse("Driver reviews loaded", result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOwnProfile,
  updateOwnProfile,
  updateOwnAvailability,
  getOwnReviews,
  listPublicDrivers,
  getPublicDriver
};
