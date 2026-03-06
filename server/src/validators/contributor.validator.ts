import { body, param, query } from "express-validator";

export const createContributorValidator = [
  body("name").trim().isLength({ min: 2, max: 120 }),
  body("phoneNo").optional({ values: "falsy" }).trim().isLength({ min: 7, max: 20 }),
  body("email").optional({ values: "falsy" }).isEmail().normalizeEmail(),
  body("address").optional({ values: "falsy" }).trim().isLength({ min: 3, max: 250 }),
];

export const contributorFilterValidator = [
  query("search").optional().trim().isLength({ min: 1, max: 100 }),
];

export const updateContributorValidator = [
  param("id").isMongoId(),
  body("name").optional().trim().isLength({ min: 2, max: 120 }),
  body("phoneNo").optional({ values: "falsy" }).trim().isLength({ min: 7, max: 20 }),
  body("email").optional({ values: "falsy" }).isEmail().normalizeEmail(),
  body("address").optional({ values: "falsy" }).trim().isLength({ min: 3, max: 250 }),
];

export const deleteContributorValidator = [param("id").isMongoId()];
