import mongoose from "mongoose";
import { app } from "../src/app";
import { env } from "../src/config/env";

let connectPromise: Promise<typeof mongoose> | null = null;

const ensureDatabaseConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (env.nodeEnv === "production" && env.mongoUri.includes("127.0.0.1")) {
    throw new Error("MONGODB_URI is not configured for production.");
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    await connectPromise;
  } catch (error) {
    connectPromise = null;
    throw error;
  }
};

export default async function handler(req: unknown, res: unknown) {
  try {
    await ensureDatabaseConnection();
    return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Serverless invocation failed:", error);

    const response = res as {
      status: (code: number) => { json: (body: Record<string, unknown>) => void };
    };

    response.status(500).json({
      success: false,
      message: "Serverless function failed. Check backend environment variables and logs.",
    });
  }
}
