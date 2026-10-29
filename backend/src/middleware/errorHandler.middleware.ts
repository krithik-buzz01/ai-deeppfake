import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error occurred.";

  console.error(`[Error] [${req.method} ${req.url}] ${statusCode} - ${message}`);
  if (env.NODE_ENV !== "production" && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || "SERVER_ERROR",
    ...(env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
}
