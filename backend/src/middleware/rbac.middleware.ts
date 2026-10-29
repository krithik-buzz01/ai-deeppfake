import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/User.js";

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Operation requires one of the following roles: [${allowedRoles.join(", ")}]. Your current role is '${req.user.role}'.`
      });
      return;
    }

    next();
  };
}

export function requireAnalystOrAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole(["analyst", "admin"])(req, res, next);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole(["admin"])(req, res, next);
}
