export type PaymentMethod = "cash" | "bank_transfer" | "upi" | "card" | "other";

export interface Donation {
  _id: string;
  contributorId?: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAddress?: string;
  amount: number;
  campaign: string;
  paymentMethod: PaymentMethod;
  donationDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonationInput {
  contributorId?: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAddress?: string;
  amount: number;
  campaign: string;
  paymentMethod: PaymentMethod;
  donationDate: string;
  notes?: string;
}

export interface DonationFilters {
  search?: string;
  campaign?: string;
  from?: string;
  to?: string;
}

export interface MonthlyTotal {
  month: string;
  total: number;
}

export interface CampaignTotal {
  campaign: string;
  total: number;
}

export interface DonationStats {
  totalAmount: number;
  totalDonations: number;
  averageDonation: number;
  monthlyTotals: MonthlyTotal[];
  campaignTotals: CampaignTotal[];
  recentDonations: Donation[];
}
