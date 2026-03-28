import { Document, model, Schema } from "mongoose";

export interface InvestmentDocument extends Document {
  ownerId?: Schema.Types.ObjectId;
  nameWhereInvested: string;
  amountInvested: number;
  note?: string;
  investedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const investmentSchema = new Schema<InvestmentDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    nameWhereInvested: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 140,
    },
    amountInvested: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    investedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

investmentSchema.index({ nameWhereInvested: "text", note: "text" });
investmentSchema.index({ investedAt: -1 });
investmentSchema.index({ ownerId: 1, investedAt: -1 });

export const Investment = model<InvestmentDocument>("Investment", investmentSchema);
