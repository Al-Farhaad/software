import { Investment } from "../models/investment.model";
import { HttpError } from "../utils/http-error";
import { buildSearchPattern } from "../utils/search";

interface InvestmentFilters {
  search?: string;
}

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

export const createInvestment = async (payload: CreateInvestmentInput) => Investment.create(payload);

export const listInvestments = async (filters: InvestmentFilters) => {
  const query: Record<string, unknown> = {};
  const pattern = buildSearchPattern(filters.search);
  if (pattern) {
    query.nameWhereInvested = pattern;
  }

  return Investment.find(query).sort({ investedAt: -1, createdAt: -1 }).lean();
};

export const getTotalInvestedAmount = async () => {
  const [summary] = await Investment.aggregate<{ total: number }>([
    {
      $group: {
        _id: null,
        total: { $sum: "$amountInvested" },
      },
    },
  ]);

  return summary?.total ?? 0;
};

export const updateInvestmentById = async (id: string, payload: UpdateInvestmentInput) => {
  const investment = await Investment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!investment) {
    throw new HttpError(404, "Investment not found.");
  }

  return investment;
};

export const deleteInvestmentById = async (id: string) => {
  const investment = await Investment.findByIdAndDelete(id).lean();

  if (!investment) {
    throw new HttpError(404, "Investment not found.");
  }
};
