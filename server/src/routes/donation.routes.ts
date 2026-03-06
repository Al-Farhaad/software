import { Router } from "express";
import {
  createDonationHandler,
  deleteDonationHandler,
  emailReceiptHandler,
  getDonationByIdHandler,
  getDonationListHandler,
  getDonationStatsHandler,
} from "../controllers/donation.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createDonationValidator,
  donationFilterValidator,
  donationIdValidator,
  emailReceiptValidator,
} from "../validators/donation.validator";

export const donationRouter = Router();

donationRouter.get("/", donationFilterValidator, validateRequest, getDonationListHandler);
donationRouter.get("/stats", getDonationStatsHandler);
donationRouter.get("/:id", donationIdValidator, validateRequest, getDonationByIdHandler);
donationRouter.post("/", createDonationValidator, validateRequest, createDonationHandler);
donationRouter.post(
  "/:id/receipt/email",
  emailReceiptValidator,
  validateRequest,
  emailReceiptHandler,
);
donationRouter.delete("/:id", requireAuth, donationIdValidator, validateRequest, deleteDonationHandler);
