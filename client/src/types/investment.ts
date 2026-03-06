export interface Investment {
  _id: string;
  nameWhereInvested: string;
  amountInvested: number;
  note?: string;
  investedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentInput {
  nameWhereInvested: string;
  amountInvested: number;
  note?: string;
  investedAt?: string;
}

export interface InvestmentListPayload {
  investments: Investment[];
  totalInvested: number;
}
