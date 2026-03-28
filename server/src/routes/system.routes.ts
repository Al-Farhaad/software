import { Router } from "express";
import {
  createSubAdminHandler,
  deleteSubAdminHandler,
  deleteAllDataHandler,
  getCurrentUserHandler,
  healthCheck,
  listSubAdminsHandler,
  loginHandler,
  updateMySignatureHandler,
} from "../controllers/system.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createSubAdminValidator,
  deleteSubAdminValidator,
  loginValidator,
  updateSignatureValidator,
} from "../validators/system.validator";

export const systemRouter = Router();

systemRouter.get("/health", healthCheck);
systemRouter.post("/auth/login", loginValidator, validateRequest, loginHandler);
systemRouter.get("/auth/me", requireAuth, getCurrentUserHandler);
systemRouter.patch(
  "/auth/me/signature",
  requireAuth,
  updateSignatureValidator,
  validateRequest,
  updateMySignatureHandler,
);

systemRouter.get("/sub-admins", requireAuth, requireRole("superadmin"), listSubAdminsHandler);
systemRouter.post(
  "/sub-admins",
  requireAuth,
  requireRole("superadmin"),
  createSubAdminValidator,
  validateRequest,
  createSubAdminHandler,
);
systemRouter.delete(
  "/sub-admins/:id",
  requireAuth,
  requireRole("superadmin"),
  deleteSubAdminValidator,
  validateRequest,
  deleteSubAdminHandler,
);

systemRouter.delete("/system/data", requireAuth, requireRole("superadmin"), deleteAllDataHandler);
