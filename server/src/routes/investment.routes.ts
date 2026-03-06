import { Router } from "express";
import {
  createInvestmentHandler,
  deleteInvestmentHandler,
  getInvestmentListHandler,
  updateInvestmentHandler,
} from "../controllers/investment.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createInvestmentValidator,
  deleteInvestmentValidator,
  investmentFilterValidator,
  updateInvestmentValidator,
} from "../validators/investment.validator";

export const investmentRouter = Router();

investmentRouter.get("/", investmentFilterValidator, validateRequest, getInvestmentListHandler);
investmentRouter.post("/", createInvestmentValidator, validateRequest, createInvestmentHandler);
investmentRouter.patch("/:id", updateInvestmentValidator, validateRequest, updateInvestmentHandler);
investmentRouter.delete("/:id", deleteInvestmentValidator, validateRequest, deleteInvestmentHandler);
