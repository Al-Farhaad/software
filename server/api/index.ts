import mongoose from "mongoose";
import { app } from "../src/app";
import { env } from "../src/config/env";

let connectPromise: Promise<typeof mongoose> | null = null;

const ensureDatabaseConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(env.mongoUri);
  }

  await connectPromise;
};

export default async function handler(req: unknown, res: unknown) {
  await ensureDatabaseConnection();
  return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
