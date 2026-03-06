import { app } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
