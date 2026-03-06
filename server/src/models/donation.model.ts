import { Document, model, Schema } from "mongoose";
import { CAMPAIGN_OPTIONS, PAYMENT_METHODS, PaymentMethod } from "../constants/donation-data";

export interface DonationDocument extends Document {
  contributorId?: Schema.Types.ObjectId;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAddress?: string;
  amount: number;
  campaign: (typeof CAMPAIGN_OPTIONS)[number];
  paymentMethod: PaymentMethod;
  donationDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<DonationDocument>(
  {
    contributorId: {
      type: Schema.Types.ObjectId,
      ref: "Contributor",
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    donorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    donorPhone: {
      type: String,
      trim: true,
      maxlength: 25,
    },
    donorAddress: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    campaign: {
      type: String,
      required: true,
      enum: CAMPAIGN_OPTIONS,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: PAYMENT_METHODS,
    },
    donationDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

donationSchema.index({ donationDate: -1 });
donationSchema.index({ campaign: 1 });
donationSchema.index({ contributorId: 1 });
donationSchema.index({ donorName: "text", donorEmail: "text", donorPhone: "text", donorAddress: "text" });

export const Donation = model<DonationDocument>("Donation", donationSchema);
