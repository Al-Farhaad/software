import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";
import {
  createDonation,
  deleteDonationById,
  getDonationById,
  getDonationStats,
  listDonations,
} from "../services/donation.service";
import { sendDonationReceiptEmail } from "../services/email.service";

export const createDonationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donation = await createDonation(req.body);
    res.status(201).json({
      success: true,
      data: donation,
      message: "Donation created.",
    });
  } catch (error) {
    next(error);
  }
};

export const getDonationListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donations = await listDonations({
      search: req.query.search as string | undefined,
      campaign: req.query.campaign as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });

    res.json({
      success: true,
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

export const getDonationByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donation = await getDonationById(String(req.params.id));
    if (!donation) {
      throw new HttpError(404, "Donation not found.");
    }

    res.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

export const getDonationStatsHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getDonationStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const emailReceiptHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donation = await getDonationById(String(req.params.id));
    if (!donation) {
      throw new HttpError(404, "Donation not found.");
    }

    const recipient = (req.body.email as string | undefined) ?? donation.donorEmail;
    if (!recipient) {
      throw new HttpError(400, "Email address is required.");
    }

    await sendDonationReceiptEmail(recipient, donation);

    res.json({
      success: true,
      data: { queued: true },
      message: "Receipt email queued.",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDonationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await deleteDonationById(String(req.params.id));
    if (!deleted) {
      throw new HttpError(404, "Donation not found.");
    }

    res.json({
      success: true,
      message: "Donation deleted.",
    });
  } catch (error) {
    next(error);
  }
};
