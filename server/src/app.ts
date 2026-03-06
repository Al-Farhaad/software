import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { apiLimiter } from "./middlewares/rate-limit.middleware";
import { apiRouter } from "./routes";

export const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(apiLimiter);

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
