import mongoose from "mongoose";
import { env } from "./env";

export const connectDatabase = async () => {
  await mongoose.connect(env.mongoUri);
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};
