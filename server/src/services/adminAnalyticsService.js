const User = require("../models/User");
const DriverProfile = require("../models/DriverProfile");
const DriverApplication = require("../models/DriverApplication");
const DriverDocument = require("../models/DriverDocument");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const IncidentReport = require("../models/IncidentReport");
const Subscription = require("../models/Subscription");
const DummyPayment = require("../models/DummyPayment");
const AdminAuditLog = require("../models/AdminAuditLog");
const { getDateRange, dateFilter } = require("../utils/dateRange");

function toPlainMap(rows) {
  return rows.reduce(function (output, row) {
    output[row._id || "Unknown"] = row.count;
    return output;
  }, {});
}

async function countBy(Model, field, match = {}) {
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: "$" + field, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  return toPlainMap(rows);
}

async function sumPayments(match = {}) {
  const rows = await DummyPayment.aggregate([
    { $match: Object.assign({ status: "Success" }, match) },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  return rows[0] ? rows[0].total : 0;
}

async function averageReviewRating(match = {}) {
  const rows = await Review.aggregate([
    { $match: match },
    { $group: { _id: null, average: { $avg: "$rating" } } }
  ]);
  return rows[0] && rows[0].average ? Number(rows[0].average.toFixed(2)) : 0;
}

function monthPaymentMatch(query) {
  const range = getDateRange(query, "month");
  return dateFilter("createdAt", range);
}

async function getOverview() {
  const currentMonth = getDateRange({ period: "month" }, "month");
  const currentMonthPaymentMatch = dateFilter("createdAt", currentMonth);
  const openReportFilter = { status: { $ne: "Resolved" } };

  const [
    totalUsers,
    totalClients,
    totalDrivers,
    totalAdmins,
    pendingDriverApplications,
    approvedDrivers,
    visibleDrivers,
    suspendedDrivers,
    totalBookings,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    cancelledBookings,
    reportedBookings,
    totalReviews,
    averagePlatformRating,
    flaggedReviews,
    totalIncidentReports,
    openIncidentReports,
    emergencyReports,
    activeSubscriptions,
    pendingSubscriptions,
    expiredSubscriptions,
    cancelledSubscriptions,
    totalDummyRevenue,
    monthlyDummyRevenue
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "client" }),
    User.countDocuments({ role: "driver" }),
    User.countDocuments({ role: "admin" }),
    DriverApplication.countDocuments({ status: "Pending" }),
    DriverProfile.countDocuments({ isApproved: true }),
    DriverProfile.countDocuments({ profileVisibility: "Visible" }),
    DriverProfile.countDocuments({ isSuspended: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: "Pending" }),
    Booking.countDocuments({ status: "Accepted" }),
    Booking.countDocuments({ status: "Completed" }),
    Booking.countDocuments({ status: "Cancelled" }),
    Booking.countDocuments({ status: "Reported" }),
    Review.countDocuments(),
    averageReviewRating(),
    Review.countDocuments({ flagged: true }),
    IncidentReport.countDocuments(),
    IncidentReport.countDocuments(openReportFilter),
    IncidentReport.countDocuments({ urgency: "Emergency" }),
    Subscription.countDocuments({ status: "Active" }),
    Subscription.countDocuments({ status: "Pending" }),
    Subscription.countDocuments({ status: "Expired" }),
    Subscription.countDocuments({ status: "Cancelled" }),
    sumPayments(),
    sumPayments(currentMonthPaymentMatch)
  ]);

  return {
    totalUsers,
    totalClients,
    totalDrivers,
    totalAdmins,
    pendingDriverApplications,
    approvedDrivers,
    visibleDrivers,
    suspendedDrivers,
    totalBookings,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    cancelledBookings,
    reportedBookings,
    totalReviews,
    averagePlatformRating,
    flaggedReviews,
    totalIncidentReports,
    openIncidentReports,
    emergencyReports,
    activeSubscriptions,
    pendingSubscriptions,
    expiredSubscriptions,
    cancelledSubscriptions,
    totalDummyRevenue,
    monthlyDummyRevenue
  };
}

async function getBookingAnalytics(query = {}) {
  const range = getDateRange(query, "month");
  const match = dateFilter("dateTime", range);
  const [bookingsByStatus, bookingsByType, bookingsByDay, completedBookings, cancelledBookings, reportedBookings] = await Promise.all([
    countBy(Booking, "status", match),
    countBy(Booking, "bookingType", match),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$dateTime" } },
            type: "$bookingType"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.day": 1 } }
    ]),
    Booking.countDocuments(Object.assign({}, match, { status: "Completed" })),
    Booking.countDocuments(Object.assign({}, match, { status: "Cancelled" })),
    Booking.countDocuments(Object.assign({}, match, { status: "Reported" }))
  ]);

  const timeSeries = bookingsByDay.map(function (row) {
    return {
      date: row._id.day,
      bookingType: row._id.type,
      count: row.count
    };
  });

  return {
    period: range.period,
    bookingsByStatus,
    bookingsByType,
    bookingsByDay: timeSeries,
    completedBookings,
    cancelledBookings,
    reportedBookings
  };
}

async function getDriverAnalytics() {
  const [
    approved,
    pending,
    suspended,
    visible,
    hidden,
    driversByAvailability,
    driversByCityRows,
    topRatedDrivers,
    mostCompletedTripsDrivers,
    driversWithPendingSubscriptions
  ] = await Promise.all([
    DriverProfile.countDocuments({ isApproved: true }),
    DriverProfile.countDocuments({ isApproved: false }),
    DriverProfile.countDocuments({ isSuspended: true }),
    DriverProfile.countDocuments({ profileVisibility: "Visible" }),
    DriverProfile.countDocuments({ profileVisibility: "Hidden" }),
    countBy(DriverProfile, "availability"),
    DriverProfile.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    DriverProfile.find({ isApproved: true })
      .sort({ ratingAverage: -1, completedTrips: -1 })
      .limit(8)
      .populate("userId", "fullName")
      .lean(),
    DriverProfile.find({ isApproved: true })
      .sort({ completedTrips: -1, ratingAverage: -1 })
      .limit(8)
      .populate("userId", "fullName")
      .lean(),
    Subscription.countDocuments({ status: "Pending" })
  ]);

  function serializeDriver(driver) {
    return {
      driverId: driver._id,
      publicDriverId: driver.publicDriverId,
      fullName: driver.userId && driver.userId.fullName ? driver.userId.fullName : "Umusare driver",
      ratingAverage: driver.ratingAverage || 0,
      completedTrips: driver.completedTrips || 0,
      driverBadge: driver.driverBadge,
      availability: driver.availability,
      city: driver.city
    };
  }

  return {
    driversByApprovalStatus: { approved, pending, suspended },
    driversByVisibility: { Visible: visible, Hidden: hidden },
    driversByAvailability,
    driversByCity: toPlainMap(driversByCityRows),
    topRatedDrivers: topRatedDrivers.map(serializeDriver),
    mostCompletedTripsDrivers: mostCompletedTripsDrivers.map(serializeDriver),
    suspendedDriversCount: suspended,
    driversWithPendingSubscriptions
  };
}

async function getApplicationAnalytics() {
  const [applicationsByStatus, applicationsByPlan, applicationsByCityRows, documentsPendingReview, documentsRejected, documentsVerified] = await Promise.all([
    countBy(DriverApplication, "status"),
    countBy(DriverApplication, "selectedSubscriptionPlan"),
    DriverApplication.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    DriverDocument.countDocuments({ status: { $in: ["Submitted", "Needs Review"] } }),
    DriverDocument.countDocuments({ status: "Rejected" }),
    DriverDocument.countDocuments({ status: "Verified" })
  ]);

  return {
    applicationsByStatus,
    applicationsByPlan,
    applicationsByCity: toPlainMap(applicationsByCityRows),
    documentsPendingReview,
    documentsRejected,
    documentsVerified
  };
}

async function getRevenueAnalytics(query = {}) {
  const paymentMatch = monthPaymentMatch(query);
  const [totalDummyRevenue, monthlyDummyRevenue, paymentsByStatus, subscriptionsByPlan, activeBasicSubscriptions, activeProSubscriptions, pendingPayments, failedPayments] = await Promise.all([
    sumPayments(),
    sumPayments(paymentMatch),
    countBy(DummyPayment, "status", paymentMatch),
    countBy(Subscription, "plan"),
    Subscription.countDocuments({ status: "Active", plan: "Basic" }),
    Subscription.countDocuments({ status: "Active", plan: "Pro" }),
    DummyPayment.countDocuments(Object.assign({}, paymentMatch, { status: "Pending" })),
    DummyPayment.countDocuments(Object.assign({}, paymentMatch, { status: "Failed" }))
  ]);

  return {
    totalDummyRevenue,
    monthlyDummyRevenue,
    paymentsByStatus,
    subscriptionsByPlan,
    activeBasicSubscriptions,
    activeProSubscriptions,
    pendingPayments,
    failedPayments,
    note: "Dummy revenue only. Real Mobile Money revenue is not connected yet."
  };
}

async function getReportAnalytics() {
  const openFilter = { status: { $ne: "Resolved" } };
  const [reportsByStatus, reportsByUrgency, reportsByType, openReports, resolvedReports, emergencyReports, highUrgencyReports, recentReports] = await Promise.all([
    countBy(IncidentReport, "status"),
    countBy(IncidentReport, "urgency"),
    countBy(IncidentReport, "reportType"),
    IncidentReport.countDocuments(openFilter),
    IncidentReport.countDocuments({ status: "Resolved" }),
    IncidentReport.countDocuments({ urgency: "Emergency" }),
    IncidentReport.countDocuments({ urgency: "High" }),
    IncidentReport.find().sort({ createdAt: -1 }).limit(8).lean()
  ]);

  return {
    reportsByStatus,
    reportsByUrgency,
    reportsByType,
    openReports,
    resolvedReports,
    emergencyReports,
    highUrgencyReports,
    recentReports: recentReports.map(function (report) {
      return {
        reportId: report.reportId,
        bookingId: report.bookingId,
        reportedByRole: report.reportedByRole,
        reportType: report.reportType,
        urgency: report.urgency,
        status: report.status,
        createdAt: report.createdAt
      };
    })
  };
}

function activityItem(type, title, description, createdAt, linkTarget) {
  return { type, title, description, createdAt, linkTarget };
}

async function getRecentActivity() {
  const [applications, bookings, reviews, flaggedReviews, reports, payments, subscriptions, auditLogs] = await Promise.all([
    DriverApplication.find().sort({ createdAt: -1 }).limit(5).select("applicationNumber fullName status createdAt").lean(),
    Booking.find().sort({ createdAt: -1 }).limit(5).select("bookingId bookingType status pickupLocation destination createdAt").lean(),
    Review.find().sort({ createdAt: -1 }).limit(5).select("reviewId rating flagged createdAt").lean(),
    Review.find({ flagged: true }).sort({ createdAt: -1 }).limit(5).select("reviewId rating flagReason createdAt").lean(),
    IncidentReport.find().sort({ createdAt: -1 }).limit(5).select("reportId reportType urgency status createdAt").lean(),
    DummyPayment.find().sort({ createdAt: -1 }).limit(5).select("paymentId status amount currency createdAt").lean(),
    Subscription.find().sort({ updatedAt: -1 }).limit(5).select("subscriptionId plan status paymentStatus updatedAt createdAt").lean(),
    AdminAuditLog.find().sort({ createdAt: -1 }).limit(8).select("action targetType targetId description createdAt").lean()
  ]);

  const items = [];
  applications.forEach(function (item) {
    items.push(activityItem("application", "Driver application " + item.status, item.applicationNumber + " - " + item.fullName, item.createdAt, { type: "driverApplication", id: item._id }));
  });
  bookings.forEach(function (item) {
    items.push(activityItem("booking", item.bookingType + " booking " + item.status, item.bookingId + " from " + item.pickupLocation + " to " + item.destination, item.createdAt, { type: "booking", id: item.bookingId }));
  });
  reviews.forEach(function (item) {
    items.push(activityItem("review", "Review submitted", "Rating: " + item.rating + (item.flagged ? " - flagged" : ""), item.createdAt, { type: "review", id: item.reviewId }));
  });
  flaggedReviews.forEach(function (item) {
    items.push(activityItem("flagged-review", "Flagged review needs attention", "Rating: " + item.rating + (item.flagReason ? " - " + item.flagReason : ""), item.createdAt, { type: "review", id: item.reviewId }));
  });
  reports.forEach(function (item) {
    items.push(activityItem("incident-report", item.urgency + " " + item.reportType, item.reportId + " is " + item.status, item.createdAt, { type: "report", id: item.reportId }));
  });
  payments.forEach(function (item) {
    items.push(activityItem("dummy-payment", "Dummy payment " + item.status, item.paymentId + " - " + item.amount + " " + item.currency, item.createdAt, { type: "payment", id: item.paymentId }));
  });
  subscriptions.forEach(function (item) {
    items.push(activityItem("subscription", "Subscription " + item.status, item.subscriptionId + " - " + item.plan + " / " + item.paymentStatus, item.updatedAt || item.createdAt, { type: "subscription", id: item.subscriptionId }));
  });
  auditLogs.forEach(function (item) {
    items.push(activityItem("audit-log", item.action, item.description || item.targetType + " " + item.targetId, item.createdAt, { type: item.targetType, id: item.targetId }));
  });

  return items
    .filter(function (item) { return item.createdAt; })
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    .slice(0, 20);
}

module.exports = {
  getOverview,
  getBookingAnalytics,
  getDriverAnalytics,
  getApplicationAnalytics,
  getRevenueAnalytics,
  getReportAnalytics,
  getRecentActivity
};
