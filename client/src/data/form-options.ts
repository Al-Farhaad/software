import type { PaymentMethod } from "../types/donation";

export const CAMPAIGN_OPTIONS = [
  "Education Sponsorship",
  "Healthcare Support",
  "Food Relief",
  "Women Empowerment",
  "Community Development",
  "General Fund",
];

export const PAYMENT_METHOD_OPTIONS: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Cash", value: "cash" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Other", value: "other" },
];
