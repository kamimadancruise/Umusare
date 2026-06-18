const adminDriverService = require("../services/adminDriverService");
const { successResponse } = require("../utils/apiResponse");

async function listDrivers(req, res, next) {
  try {
    const result = await adminDriverService.listDrivers(req.query);
    res.json(successResponse("Admin driver profiles loaded", result));
  } catch (error) {
    next(error);
  }
}

async function updateVisibility(req, res, next) {
  try {
    const driver = await adminDriverService.updateVisibility(req.user, req.params.driverId, req.body.profileVisibility);
    res.json(successResponse("Driver visibility updated", { driver }));
  } catch (error) {
    next(error);
  }
}

async function suspendDriver(req, res, next) {
  try {
    const driver = await adminDriverService.suspendDriver(req.user, req.params.driverId, req.body.suspensionReason);
    res.json(successResponse("Driver suspended", { driver }));
  } catch (error) {
    next(error);
  }
}

async function unsuspendDriver(req, res, next) {
  try {
    const driver = await adminDriverService.unsuspendDriver(req.user, req.params.driverId);
    res.json(successResponse("Driver unsuspended", { driver }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDrivers,
  updateVisibility,
  suspendDriver,
  unsuspendDriver
};
