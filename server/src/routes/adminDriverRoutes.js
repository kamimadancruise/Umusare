const express = require("express");
const adminDriverController = require("../controllers/adminDriverController");

const router = express.Router();

router.get("/", adminDriverController.listDrivers);
router.patch("/:driverId/visibility", adminDriverController.updateVisibility);
router.patch("/:driverId/suspend", adminDriverController.suspendDriver);
router.patch("/:driverId/unsuspend", adminDriverController.unsuspendDriver);

module.exports = router;
