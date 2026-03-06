import { format } from "date-fns";

export const formatDate = (date: string | Date, pattern = "dd MMM yyyy"): string =>
  format(new Date(date), pattern);
