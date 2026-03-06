import { body } from "express-validator";

export const tokenRequestValidator = [body("passcode").isString().isLength({ min: 6, max: 80 })];
