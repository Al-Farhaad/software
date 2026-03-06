import { NextFunction, Request, Response } from "express";
import {
  createInvestment,
  deleteInvestmentById,
  getTotalInvestedAmount,
  listInvestments,
  updateInvestmentById,
} from "../services/investment.service";

export const createInvestmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const investment = await createInvestment(req.body);
    res.status(201).json({
      success: true,
      data: investment,
      message: "Investment added.",
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestmentListHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [investments, totalInvested] = await Promise.all([
      listInvestments({
        search: req.query.search as string | undefined,
      }),
      getTotalInvestedAmount(),
    ]);

    res.json({
      success: true,
      data: {
        investments,
        totalInvested,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvestmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const investment = await updateInvestmentById(String(req.params.id), req.body);
    res.json({
      success: true,
      data: investment,
      message: "Investment updated.",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInvestmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteInvestmentById(String(req.params.id));
    res.json({
      success: true,
      message: "Investment deleted.",
    });
  } catch (error) {
    next(error);
  }
};
