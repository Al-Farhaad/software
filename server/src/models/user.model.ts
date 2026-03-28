import { Document, model, Schema, Types } from "mongoose";

export type UserRole = "superadmin" | "subadmin";

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  signatureDataUrl?: string;
  createdBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["superadmin", "subadmin"],
      default: "subadmin",
    },
    signatureDataUrl: {
      type: String,
      maxlength: 2000000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ createdBy: 1 });

export const User = model<UserDocument>("User", userSchema);
