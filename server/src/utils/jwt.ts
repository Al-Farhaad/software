import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "./http-error";
import type { UserRole } from "../models/user.model";

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
}

export const signAuthToken = (payload: AuthTokenPayload) => {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  try {
    return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
  } catch {
    throw new HttpError(401, "Invalid or expired token.");
  }
};
