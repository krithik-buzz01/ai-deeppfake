import crypto from "crypto";
import jwt from "jsonwebtoken";
import * as argon2 from "@node-rs/argon2";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { User, IUser, UserRole } from "../models/User.js";
import { Session, ISession } from "../models/Session.js";
import { AuditService } from "./audit.service.js";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export class AuthService {
  /**
   * Hashes a password using Argon2id with memory-hard parameters.
   */
  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      algorithm: argon2.Algorithm.Argon2id,
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });
  }

  /**
   * Verifies an Argon2id password hash.
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Issues an access token (JWT) and a rotating opaque refresh token stored in Session.
   */
  static async createSession(params: {
    user: IUser;
    ip: string;
    userAgent?: string;
  }): Promise<{ accessToken: string; refreshToken: string; session: ISession }> {
    const rawRefreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await Session.create({
      userId: params.user._id,
      refreshTokenHash,
      userAgent: params.userAgent,
      ip: params.ip,
      isValid: true,
      expiresAt
    });

    const tokenPayload: TokenPayload = {
      userId: (params.user._id as mongoose.Types.ObjectId).toString(),
      email: params.user.email,
      role: params.user.role,
      sessionId: (session._id as mongoose.Types.ObjectId).toString()
    };

    const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: "15m"
    });

    await AuditService.recordEvent({
      actorId: params.user._id as mongoose.Types.ObjectId,
      actorRole: params.user.role,
      action: "USER_LOGIN_SESSION_CREATED",
      targetResource: "Session",
      targetId: (session._id as mongoose.Types.ObjectId).toString(),
      ip: params.ip,
      userAgent: params.userAgent
    });

    return { accessToken, refreshToken: rawRefreshToken, session };
  }

  /**
   * Rotates a refresh token session, revoking the old token and issuing a new pair.
   */
  static async rotateSession(params: {
    rawRefreshToken: string;
    ip: string;
    userAgent?: string;
  }): Promise<{ accessToken: string; newRefreshToken: string }> {
    const tokenHash = crypto.createHash("sha256").update(params.rawRefreshToken).digest("hex");
    const session = await Session.findOne({
      refreshTokenHash: tokenHash,
      isValid: true
    }).populate("userId");

    if (!session || !session.userId) {
      throw new Error("Invalid or revoked session. Please re-authenticate.");
    }

    if (session.expiresAt < new Date()) {
      session.isValid = false;
      await session.save();
      throw new Error("Session expired. Please log in again.");
    }

    const user = session.userId as unknown as IUser;

    // Invalidate old token and set new rotating refresh token
    const newRawRefreshToken = crypto.randomBytes(32).toString("hex");
    session.refreshTokenHash = crypto.createHash("sha256").update(newRawRefreshToken).digest("hex");
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    session.ip = params.ip;
    session.userAgent = params.userAgent;
    await session.save();

    const tokenPayload: TokenPayload = {
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
      sessionId: (session._id as mongoose.Types.ObjectId).toString()
    };

    const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: "15m"
    });

    return { accessToken, newRefreshToken: newRawRefreshToken };
  }

  /**
   * Revokes a session upon user logout.
   */
  static async revokeSession(sessionId: string, actorId?: string, ip?: string): Promise<void> {
    await Session.findByIdAndUpdate(sessionId, { isValid: false });
    if (actorId && ip) {
      await AuditService.recordEvent({
        actorId,
        actorRole: "user",
        action: "USER_LOGOUT_SESSION_REVOKED",
        targetResource: "Session",
        targetId: sessionId,
        ip
      });
    }
  }
}
