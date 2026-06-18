const adminAnalyticsService = require("../services/adminAnalyticsService");
const { successResponse } = require("../utils/apiResponse");

async function overview(req, res, next) {
  try {
    const analytics = await adminAnalyticsService.getOverview();
    res.json(successResponse("Admin analytics overview loaded", { analytics }));
  } catch (error) {
    next(error);
  }
}

async function bookings(req, res, next) {
  try {
    const analytics = await adminAnalyticsService.getBookingAnalytics(req.query);
    res.json(successResponse("Booking analytics loaded", { analytics }));
  } catch (error) {
    next(error);
  }
}

async function drivers(req, res, next) {
  try {
    const analytics = await adminAnalyticsService.getDriverAnalytics();
    res.json(successResponse("Driver analytics loaded", { analytics }));
  } catch (error) {
    next(error);
  }
}

async function applications(req, res, next) {
  try {
    const analytics = await adminAnalyticsService.getApplicationAnalytics();
    res.json(successResponse("Driver application analytics loaded", { analytics }));
  } catch (error) {
    next(error);
  }
}

async function revenue(req, res, next) {
  try {
    const analytics = await adminAnalyticsService.getRevenueAnalytics(req.query);
    res.json(successResponse("Dummy revenue analytics loaded", { analytics }));
  } catch (error) {
    next(error);
  }
}

async function reports(req, res, next) {
  try {
    const analytics = await adminAnalyticsService.getReportAnalytics();
    res.json(successResponse("Incident report analytics loaded", { analytics }));
  } catch (error) {
    next(error);
  }
}

async function recentActivity(req, res, next) {
  try {
    const activity = await adminAnalyticsService.getRecentActivity();
    res.json(successResponse("Recent admin activity loaded", { activity }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  overview,
  bookings,
  drivers,
  applications,
  revenue,
  reports,
  recentActivity
};
