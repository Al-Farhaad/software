export const CAMPAIGN_OPTIONS = [
  "Education Sponsorship",
  "Healthcare Support",
  "Food Relief",
  "Women Empowerment",
  "Community Development",
  "General Fund",
] as const;

export const PAYMENT_METHODS = ["cash", "bank_transfer", "upi", "card", "other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
