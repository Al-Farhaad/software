import { Request, Response } from "express";
import { env } from "../config/env";
import { signAuthToken } from "../utils/jwt";
import { HttpError } from "../utils/http-error";
import { hashPasswordSync, verifyPassword } from "../utils/password";
import { Donation } from "../models/donation.model";
import { Investment } from "../models/investment.model";
import { Contributor } from "../models/contributor.model";

const adminPasscodeHash = env.adminPasscodeHash ?? hashPasswordSync(env.adminPasscode);

export const healthCheck = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
};

export const issueAuthToken = async (req: Request, res: Response) => {
  const { passcode } = req.body as { passcode: string };
  const isValidPasscode = await verifyPassword(passcode, adminPasscodeHash);

  if (!isValidPasscode) {
    throw new HttpError(401, "Invalid passcode.");
  }

  const token = signAuthToken({
    userId: "admin",
    role: "admin",
  });

  res.json({
    success: true,
    data: {
      token,
      expiresIn: env.jwtExpiresIn,
    },
    message: "Token issued.",
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
