import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt";
import { HttpError } from "../utils/http-error";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authorization token is required."));
  }

  const token = authorization.slice("Bearer ".length);
  req.auth = verifyAuthToken(token);
  return next();
};
