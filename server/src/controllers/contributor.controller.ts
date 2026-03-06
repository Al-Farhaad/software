import { NextFunction, Request, Response } from "express";
import {
  createContributor,
  deleteContributorById,
  listContributors,
  updateContributorById,
} from "../services/contributor.service";

export const createContributorHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const contributor = await createContributor(req.body);
    res.status(201).json({
      success: true,
      data: contributor,
      message: "Contributor created.",
    });
  } catch (error) {
    next(error);
  }
};

export const getContributorListHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const contributors = await listContributors({
      search: req.query.search as string | undefined,
    });
    res.json({
      success: true,
      data: contributors,
    });
  } catch (error) {
    next(error);
  }
};

export const updateContributorHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const contributor = await updateContributorById(String(req.params.id), req.body);
    res.json({
      success: true,
      data: contributor,
      message: "Contributor updated.",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContributorHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteContributorById(String(req.params.id));
    res.json({
      success: true,
      message: "Contributor deleted.",
    });
  } catch (error) {
    next(error);
  }
};
