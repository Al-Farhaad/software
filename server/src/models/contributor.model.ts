import { Document, model, Schema } from "mongoose";

export interface ContributorDocument extends Document {
  ownerId?: Schema.Types.ObjectId;
  contributorId: string;
  name: string;
  phoneNo?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contributorSchema = new Schema<ContributorDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    contributorId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2}\d{4}$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    phoneNo: {
      type: String,
      trim: true,
      minlength: 7,
      maxlength: 20,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 250,
    },
  },
  {
    timestamps: true,
  },
);

contributorSchema.index({ name: "text", phoneNo: "text", email: "text", contributorId: "text" });
contributorSchema.index({ ownerId: 1, createdAt: -1 });

export const Contributor = model<ContributorDocument>("Contributor", contributorSchema);
