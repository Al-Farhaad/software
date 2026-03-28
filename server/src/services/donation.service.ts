import { Types } from "mongoose";
import { PaymentMethod } from "../constants/donation-data";
import { Contributor } from "../models/contributor.model";
import { Donation } from "../models/donation.model";
import type { AuthTokenPayload } from "../utils/jwt";
import { buildSearchPattern, parseDateSafe } from "../utils/search";
import { HttpError } from "../utils/http-error";

interface DonationFilters {
  search?: string;
  campaign?: string;
  from?: string;
  to?: string;
}

interface CreateDonationInput {
  contributorId?: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAddress?: string;
  amount: number;
  campaign: string;
  paymentMethod: PaymentMethod;
  donationDate?: string;
  notes?: string;
}

interface DonationStatsPayload {
  totalAmount: number;
  totalDonations: number;
  averageDonation: number;
  monthlyTotals: Array<{ month: string; total: number }>;
  campaignTotals: Array<{ campaign: string; total: number }>;
  recentDonations: unknown[];
}

const ownerFilter = (auth: AuthTokenPayload): Record<string, string> =>
  auth.role === "superadmin" ? {} : { ownerId: auth.userId };

export const createDonation = async (payload: CreateDonationInput, auth: AuthTokenPayload) => {
  if (payload.contributorId) {
    const contributorQuery = {
      _id: payload.contributorId,
      ...ownerFilter(auth),
    } as Record<string, unknown>;
    const contributor = await Contributor.findOne(contributorQuery).lean();
    if (!contributor) {
      throw new HttpError(400, "Contributor not found for this account.");
    }
  }

  return Donation.create({
    ownerId: auth.userId,
    contributorId: payload.contributorId ? new Types.ObjectId(payload.contributorId) : undefined,
    donorName: payload.donorName,
    donorEmail: payload.donorEmail,
    donorPhone: payload.donorPhone,
    donorAddress: payload.donorAddress,
    amount: payload.amount,
    campaign: payload.campaign,
    paymentMethod: payload.paymentMethod,
    donationDate: payload.donationDate ? new Date(payload.donationDate) : undefined,
    notes: payload.notes,
  } as Record<string, unknown>);
};

export const getDonationById = async (id: string, auth: AuthTokenPayload) => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  const query = { _id: id, ...ownerFilter(auth) } as Record<string, unknown>;
  return Donation.findOne(query).lean();
};

export const listDonations = async (filters: DonationFilters, auth: AuthTokenPayload) => {
  const query: Record<string, unknown> = ownerFilter(auth);

  const pattern = buildSearchPattern(filters.search);
  if (pattern) {
    query.$or = [{ donorName: pattern }, { donorEmail: pattern }, { donorPhone: pattern }];
  }

  if (filters.campaign) {
    query.campaign = filters.campaign;
  }

  if (filters.from || filters.to) {
    const donationDate: Record<string, Date> = {};
    const from = parseDateSafe(filters.from);
    const to = parseDateSafe(filters.to);
    if (from) {
      donationDate.$gte = from;
    }
    if (to) {
      donationDate.$lte = to;
    }
    if (Object.keys(donationDate).length) {
      query.donationDate = donationDate;
    }
  }

  return Donation.find(query).sort({ donationDate: -1 }).lean();
};

export const deleteDonationById = async (id: string, auth: AuthTokenPayload) => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  const query = { _id: id, ...ownerFilter(auth) } as Record<string, unknown>;
  return Donation.findOneAndDelete(query).lean();
};

export const getDonationStats = async (auth: AuthTokenPayload) => {
  const ownerMatch = ownerFilter(auth);
  const ownerStages = Object.keys(ownerMatch).length ? [{ $match: ownerMatch }] : [];

  const [summary] = await Donation.aggregate<{
    totalAmount: number;
    totalDonations: number;
    averageDonation: number;
  }>([
    ...ownerStages,
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        totalDonations: { $sum: 1 },
        averageDonation: { $avg: "$amount" },
      },
    },
  ]);

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthlyRaw = await Donation.aggregate<{ key: string; total: number }>([
    ...ownerStages,
    { $match: { donationDate: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: "$donationDate" },
          month: { $month: "$donationDate" },
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        key: {
          $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }],
        },
        total: 1,
      },
    },
  ]);

  const monthTotalsMap = monthlyRaw.reduce<Record<string, number>>((acc, current) => {
    acc[current.key] = current.total;
    return acc;
  }, {});

  const monthlyTotals = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      total: monthTotalsMap[key] ?? 0,
    };
  });

  const campaignTotals = await Donation.aggregate<{ campaign: string; total: number }>([
    ...ownerStages,
    {
      $group: {
        _id: "$campaign",
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        campaign: "$_id",
        total: 1,
      },
    },
  ]);

  const recentDonations = await Donation.find(ownerMatch).sort({ donationDate: -1 }).limit(5).lean();

  return {
    totalAmount: summary?.totalAmount ?? 0,
    totalDonations: summary?.totalDonations ?? 0,
    averageDonation: Math.round(summary?.averageDonation ?? 0),
    monthlyTotals,
    campaignTotals,
    recentDonations,
  } satisfies DonationStatsPayload;
};
