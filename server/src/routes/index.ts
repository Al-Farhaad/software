import { Router } from "express";
import { contributorRouter } from "./contributor.routes";
import { donationRouter } from "./donation.routes";
import { investmentRouter } from "./investment.routes";
import { systemRouter } from "./system.routes";

export const apiRouter = Router();

apiRouter.use(systemRouter);
apiRouter.use("/contributors", contributorRouter);
apiRouter.use("/donations", donationRouter);
apiRouter.use("/investments", investmentRouter);
