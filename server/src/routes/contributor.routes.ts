import { Router } from "express";
import {
  createContributorHandler,
  deleteContributorHandler,
  getContributorListHandler,
  updateContributorHandler,
} from "../controllers/contributor.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  contributorFilterValidator,
  createContributorValidator,
  deleteContributorValidator,
  updateContributorValidator,
} from "../validators/contributor.validator";
import { requireAuth } from "../middlewares/auth.middleware";

export const contributorRouter = Router();

contributorRouter.use(requireAuth);

contributorRouter.get("/", contributorFilterValidator, validateRequest, getContributorListHandler);
contributorRouter.post("/", createContributorValidator, validateRequest, createContributorHandler);
contributorRouter.patch("/:id", updateContributorValidator, validateRequest, updateContributorHandler);
contributorRouter.delete("/:id", deleteContributorValidator, validateRequest, deleteContributorHandler);
