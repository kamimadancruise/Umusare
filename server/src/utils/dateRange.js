function startOfDay(date) {
  const output = new Date(date);
  output.setHours(0, 0, 0, 0);
  return output;
}

function endOfDay(date) {
  const output = new Date(date);
  output.setHours(23, 59, 59, 999);
  return output;
}

function parseDate(value, boundary) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return boundary === "end" ? endOfDay(date) : startOfDay(date);
}

function rangeFromPeriod(period) {
  const normalized = String(period || "month").toLowerCase();
  const now = new Date();

  if (normalized === "all") {
    return { startDate: null, endDate: null, period: "all" };
  }

  if (normalized === "today") {
    return { startDate: startOfDay(now), endDate: endOfDay(now), period: "today" };
  }

  if (normalized === "week") {
    const startDate = startOfDay(now);
    startDate.setDate(startDate.getDate() - 6);
    return { startDate, endDate: endOfDay(now), period: "week" };
  }

  if (normalized === "year") {
    return {
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: endOfDay(now),
      period: "year"
    };
  }

  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: endOfDay(now),
    period: "month"
  };
}

function getDateRange(query = {}, defaultPeriod = "month") {
  const explicitStart = parseDate(query.dateFrom, "start");
  const explicitEnd = parseDate(query.dateTo, "end");
  const base = rangeFromPeriod(query.period || defaultPeriod);
  const startDate = explicitStart || base.startDate;
  const endDate = explicitEnd || base.endDate;

  return {
    startDate,
    endDate,
    period: query.period || base.period
  };
}

function dateFilter(field, range) {
  if (!range || (!range.startDate && !range.endDate)) return {};
  const filter = {};
  filter[field] = {};
  if (range.startDate) filter[field].$gte = range.startDate;
  if (range.endDate) filter[field].$lte = range.endDate;
  return filter;
}

module.exports = {
  getDateRange,
  dateFilter
};
