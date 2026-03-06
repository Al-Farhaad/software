import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const details = error instanceof HttpError ? error.details : undefined;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error.",
    ...(details ? { details } : {}),
  });
};
