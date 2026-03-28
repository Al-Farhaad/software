import { env } from "../config/env";
import { User } from "../models/user.model";
import { hashPassword } from "../utils/password";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const ensureSuperAdminAccount = async () => {
  const email = normalizeEmail(env.superAdminEmail);
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== "superadmin") {
      existing.role = "superadmin";
      await existing.save();
    }
    return existing;
  }

  const passwordHash = await hashPassword(env.superAdminPassword);
  return User.create({
    name: env.superAdminName,
    email,
    passwordHash,
    role: "superadmin",
  });
};

export const sanitizeUser = (user: {
  _id: { toString: () => string };
  name: string;
  email: string;
  role: "superadmin" | "subadmin";
  signatureDataUrl?: string;
  createdAt?: Date | string;
}) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  signatureDataUrl: user.signatureDataUrl,
  createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
});
