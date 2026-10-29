import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { seedDefaultAccounts } from "./services/seed.service.js";

async function startServer() {
  try {
    console.log("=== Initializing VERIFAI Secure Forensic Backend ===");
    await connectDatabase();
    await seedDefaultAccounts();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`[VERIFAI Gateway] Server running on http://localhost:${env.PORT}`);
      console.log(`[VERIFAI Gateway] API Base: http://localhost:${env.PORT}/api/v1`);
      console.log(`[VERIFAI Gateway] Environment: ${env.NODE_ENV}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log("[Server] Database disconnected. Process exit completed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (err: any) {
    console.error(`[Server] Fatal startup error: ${err.message}`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
