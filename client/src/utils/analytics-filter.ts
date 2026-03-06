import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

export type AnalyticsFilterType = "weekly" | "monthly" | "yearly" | "day";

interface AnalyticsRangeBounds {
  start: Date;
  end: Date;
}

const asAnchorDate = (dateInput: string) =>
  dateInput ? new Date(`${dateInput}T12:00:00`) : new Date();

export const defaultAnalyticsDate = () => format(new Date(), "yyyy-MM-dd");

export const getAnalyticsBounds = (
  filterType: AnalyticsFilterType,
  dateInput: string,
): AnalyticsRangeBounds => {
  const anchor = asAnchorDate(dateInput);

  switch (filterType) {
    case "weekly": {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      return { start, end: endOfWeek(anchor, { weekStartsOn: 1 }) };
    }
    case "monthly": {
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    }
    case "yearly": {
      return { start: startOfYear(anchor), end: endOfYear(anchor) };
    }
    case "day":
    default: {
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    }
  }
};

export const filterByAnalyticsRange = <T>(
  records: T[],
  getDate: (record: T) => string | Date,
  filterType: AnalyticsFilterType,
  dateInput: string,
) => {
  const { start, end } = getAnalyticsBounds(filterType, dateInput);

  return records.filter((record) => {
    const value = new Date(getDate(record));
    if (Number.isNaN(value.getTime())) {
      return false;
    }
    return value >= start && value <= end;
  });
};

export const analyticsFilterLabel = (
  filterType: AnalyticsFilterType,
  dateInput: string,
) => {
  const { start, end } = getAnalyticsBounds(filterType, dateInput);

  if (filterType === "day") {
    return format(start, "dd MMM yyyy");
  }
  if (filterType === "weekly") {
    return `${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`;
  }
  if (filterType === "monthly") {
    return format(start, "MMMM yyyy");
  }

  return format(start, "yyyy");
};
