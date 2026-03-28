import { Request } from "express";
import { HttpError } from "./http-error";

export const getRequestAuth = (req: Request) => {
  if (!req.auth) {
    throw new HttpError(401, "Authorization token is required.");
  }
  return req.auth;
};
