import { Router } from "express";
import { deleteAllDataHandler, healthCheck, issueAuthToken } from "../controllers/system.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import { tokenRequestValidator } from "../validators/system.validator";

export const systemRouter = Router();

systemRouter.get("/health", healthCheck);
systemRouter.post("/auth/token", tokenRequestValidator, validateRequest, issueAuthToken);
systemRouter.delete("/system/data", requireAuth, deleteAllDataHandler);
