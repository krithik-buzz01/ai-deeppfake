import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User, IUser } from "../models/User.js";
import { TokenPayload } from "../services/auth.service.js";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      sessionId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.accessToken;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({ success: false, error: "Authentication required. No session token provided." });
      return;
    }

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (err: any) {
      res.status(401).json({ success: false, error: "Invalid or expired access token.", code: "TOKEN_EXPIRED" });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, error: "User account not found." });
      return;
    }

    // Require both email and phone verification before granting access
    if (!user.emailVerified || !user.phoneVerified) {
      res.status(403).json({
        success: false,
        error: "Account verification incomplete. Both email and mobile number ownership must be verified before accessing VERIFAI portals.",
        verificationStatus: {
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified
        }
      });
      return;
    }

    req.user = user;
    req.sessionId = payload.sessionId;
    next();
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Authentication error: ${err.message}` });
  }
}
