import { Request, Response } from "express";
import { Types } from "mongoose";
import { env } from "../config/env";
import { Contributor } from "../models/contributor.model";
import { Donation } from "../models/donation.model";
import { Investment } from "../models/investment.model";
import { User } from "../models/user.model";
import { sanitizeUser } from "../services/user.service";
import { HttpError } from "../utils/http-error";
import { signAuthToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";
import { getRequestAuth } from "../utils/request-auth";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const healthCheck = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
};

export const loginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.isActive) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const token = signAuthToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name,
  });

  res.json({
    success: true,
    data: {
      token,
      expiresIn: env.jwtExpiresIn,
      user: sanitizeUser(user),
    },
    message: "Login successful.",
  });
};

export const getCurrentUserHandler = async (req: Request, res: Response) => {
  const auth = getRequestAuth(req);
  const user = await User.findById(auth.userId).lean();
  if (!user || !user.isActive) {
    throw new HttpError(404, "User not found.");
  }

  res.json({
    success: true,
    data: sanitizeUser(user),
  });
};

export const listSubAdminsHandler = async (_req: Request, res: Response) => {
  const subAdmins = await User.find({ role: "subadmin", isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: subAdmins.map((user) => sanitizeUser(user)),
  });
};

export const createSubAdminHandler = async (req: Request, res: Response) => {
  const auth = getRequestAuth(req);
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };
  const normalizedEmail = normalizeEmail(email);
  const existing = await User.exists({ email: normalizedEmail });

  if (existing) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const subAdmin = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: "subadmin",
    createdBy: new Types.ObjectId(auth.userId),
  });

  res.status(201).json({
    success: true,
    data: sanitizeUser(subAdmin),
    message: "Sub-admin created.",
  });
};

export const deleteSubAdminHandler = async (req: Request, res: Response) => {
  const subAdminId = String(req.params.id);
  const deletedSubAdmin = await User.findOneAndDelete({
    _id: subAdminId,
    role: "subadmin",
    isActive: true,
  }).lean();

  if (!deletedSubAdmin) {
    throw new HttpError(404, "Sub-admin not found.");
  }

  res.json({
    success: true,
    message: "Sub-admin deleted.",
  });
};

export const updateMySignatureHandler = async (req: Request, res: Response) => {
  const auth = getRequestAuth(req);
  const { signatureDataUrl } = req.body as { signatureDataUrl?: string | null };

  const signatureValue =
    typeof signatureDataUrl === "string" && signatureDataUrl.trim() ? signatureDataUrl : null;

  const update =
    signatureValue === null
      ? { $unset: { signatureDataUrl: "" } }
      : { signatureDataUrl: signatureValue };

  const updatedUser = await User.findByIdAndUpdate(auth.userId, update, { new: true }).lean();
  if (!updatedUser || !updatedUser.isActive) {
    throw new HttpError(404, "User not found.");
  }

  res.json({
    success: true,
    data: sanitizeUser(updatedUser),
    message: "Signature updated.",
  });
};

export const deleteAllDataHandler = async (_req: Request, res: Response) => {
  const [donationResult, investmentResult, contributorResult] = await Promise.all([
    Donation.deleteMany({}),
    Investment.deleteMany({}),
    Contributor.deleteMany({}),
  ]);

  res.json({
    success: true,
    data: {
      donationsDeleted: donationResult.deletedCount ?? 0,
      investmentsDeleted: investmentResult.deletedCount ?? 0,
      contributorsDeleted: contributorResult.deletedCount ?? 0,
    },
    message: "All data deleted.",
  });
};
