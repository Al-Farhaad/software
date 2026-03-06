import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpError } from "../utils/http-error";

export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return next(new HttpError(400, "Validation failed.", errors.array()));
};
