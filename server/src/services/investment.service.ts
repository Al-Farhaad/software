import { Investment } from "../models/investment.model";
import { HttpError } from "../utils/http-error";
import { buildSearchPattern } from "../utils/search";
import type { AuthTokenPayload } from "../utils/jwt";

interface InvestmentFilters {
  search?: string;
}

const ownerFilter = (auth: AuthTokenPayload): Record<string, string> =>
  auth.role === "superadmin" ? {} : { ownerId: auth.userId };

export interface CreateInvestmentInput {
  nameWhereInvested: string;
  amountInvested: number;
  note?: string;
  investedAt?: string;
}

export interface UpdateInvestmentInput {
  nameWhereInvested?: string;
  amountInvested?: number;
  note?: string;
  investedAt?: string;
}

export const createInvestment = async (payload: CreateInvestmentInput, auth: AuthTokenPayload) =>
  Investment.create({
    ...payload,
    ownerId: auth.userId,
  } as Record<string, unknown>);

export const listInvestments = async (filters: InvestmentFilters, auth: AuthTokenPayload) => {
  const query: Record<string, unknown> = ownerFilter(auth);
  const pattern = buildSearchPattern(filters.search);
  if (pattern) {
    query.nameWhereInvested = pattern;
  }

  return Investment.find(query).sort({ investedAt: -1, createdAt: -1 }).lean();
};

export const getTotalInvestedAmount = async (auth: AuthTokenPayload) => {
  const match = ownerFilter(auth);
  const [summary] = await Investment.aggregate<{ total: number }>([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    {
      $group: {
        _id: null,
        total: { $sum: "$amountInvested" },
      },
    },
  ]);

  return summary?.total ?? 0;
};

export const updateInvestmentById = async (
  id: string,
  payload: UpdateInvestmentInput,
  auth: AuthTokenPayload,
) => {
  const query = { _id: id, ...ownerFilter(auth) } as Record<string, unknown>;
  const investment = await Investment.findOneAndUpdate(query, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!investment) {
    throw new HttpError(404, "Investment not found.");
  }

  return investment;
};

export const deleteInvestmentById = async (id: string, auth: AuthTokenPayload) => {
  const query = { _id: id, ...ownerFilter(auth) } as Record<string, unknown>;
  const investment = await Investment.findOneAndDelete(query).lean();

  if (!investment) {
    throw new HttpError(404, "Investment not found.");
  }
};
