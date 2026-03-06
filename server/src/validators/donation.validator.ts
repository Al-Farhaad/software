import { body, param, query } from "express-validator";
import { CAMPAIGN_OPTIONS, PAYMENT_METHODS } from "../constants/donation-data";

export const createDonationValidator = [
  body("contributorId").optional().isMongoId(),
  body("donorName").trim().isLength({ min: 2, max: 100 }),
  body("donorEmail").optional({ values: "falsy" }).isEmail().normalizeEmail(),
  body("donorPhone").optional().trim().isLength({ max: 25 }),
  body("donorAddress").optional().trim().isLength({ max: 250 }),
  body("amount").isFloat({ min: 1 }),
  body("campaign").isIn(CAMPAIGN_OPTIONS),
  body("paymentMethod").isIn(PAYMENT_METHODS),
  body("donationDate").optional().isISO8601(),
  body("notes").optional().trim().isLength({ max: 500 }),
];

export const donationIdValidator = [param("id").isMongoId()];

export const donationFilterValidator = [
  query("search").optional().trim().isLength({ min: 1, max: 100 }),
  query("campaign").optional().isIn(CAMPAIGN_OPTIONS),
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
];

export const emailReceiptValidator = [
  ...donationIdValidator,
  body("email").optional().isEmail().normalizeEmail(),
];
