import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { env } from "./config/env.js";

export function createApp(): Express {
  const app = express();

  // Basic security and parsing middlewares
  app.use(cors({
    origin: [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }));

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Request logger
  app.use((req, res, next) => {
    if (env.NODE_ENV !== "test") {
      console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
    }
    next();
  });

  // Mount API Gateway routes
  app.use("/api/v1", apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
