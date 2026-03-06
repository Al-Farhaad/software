import { body, param, query } from "express-validator";

export const createInvestmentValidator = [
  body("nameWhereInvested").trim().isLength({ min: 2, max: 140 }),
  body("amountInvested").isFloat({ min: 1 }),
  body("note").optional().trim().isLength({ max: 500 }),
  body("investedAt").optional().isISO8601(),
];

export const investmentFilterValidator = [
  query("search").optional().trim().isLength({ min: 1, max: 100 }),
];

export const updateInvestmentValidator = [
  param("id").isMongoId(),
  body("nameWhereInvested").optional().trim().isLength({ min: 2, max: 140 }),
  body("amountInvested").optional().isFloat({ min: 1 }),
  body("note").optional().trim().isLength({ max: 500 }),
  body("investedAt").optional().isISO8601(),
];

export const deleteInvestmentValidator = [param("id").isMongoId()];
