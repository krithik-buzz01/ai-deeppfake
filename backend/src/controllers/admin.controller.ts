import { Request, Response } from "express";
import { User, UserRole } from "../models/User.js";
import { MediaAsset } from "../models/MediaAsset.js";
import { Analysis } from "../models/Analysis.js";
import { AuditEvent } from "../models/AuditEvent.js";
import { ModelRegistry } from "../models/ModelRegistry.js";
import { Job } from "../models/Job.js";
import { AuditService } from "../services/audit.service.js";
import { AiClientService } from "../services/aiClient.service.js";
import { getDatabaseStatus } from "../config/database.js";
import { getRedisStatus } from "../config/redis.js";
import { env } from "../config/env.js";

export class AdminController {
  /**
   * System-wide statistics and metrics overview.
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ emailVerified: true, phoneVerified: true });
    const totalAnalyses = await Analysis.countDocuments();
    const completedAnalyses = await Analysis.countDocuments({ status: "completed" });
    const totalMedia = await MediaAsset.countDocuments();

    // Risk distribution
    const riskCounts = await Analysis.aggregate([
      { $group: { _id: "$overallRisk", count: { $sum: 1 } } }
    ]);

    const riskDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    for (const r of riskCounts) {
      if (r._id) riskDistribution[r._id] = r.count;
    }

    // Storage metric aggregate
    const storageAgg = await MediaAsset.aggregate([
      { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } }
    ]);
    const totalStorageBytes = storageAgg[0]?.totalBytes || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        totalAnalyses,
        completedAnalyses,
        totalMedia,
        totalStorageBytes,
        totalStorageMb: (totalStorageBytes / (1024 * 1024)).toFixed(2),
        riskDistribution
      }
    });
  }

  /**
   * List registered users with pagination and verification status.
   */
  static async listUsers(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("-passwordHash -mfaSecret")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  }

  /**
   * Server-side secure authorization to elevate or revoke user roles.
   */
  static async updateUserRole(req: Request, res: Response): Promise<void> {
    const targetUserId = req.params.userId;
    const { role } = req.body as { role: UserRole };

    if (!["user", "analyst", "admin"].includes(role)) {
      res.status(400).json({ success: false, error: "Invalid role specified." });
      return;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ success: false, error: "User not found." });
      return;
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await AuditService.recordEvent({
      actorId: req.user!._id.toString(),
      actorRole: req.user!.role,
      action: "USER_ROLE_UPDATED",
      targetResource: "User",
      targetId: targetUser._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      details: { previousRole, newRole: role }
    });

    res.status(200).json({
      success: true,
      message: `User role updated from '${previousRole}' to '${role}'.`,
      user: {
        id: targetUser._id,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  }

  /**
   * Health status of all external and internal providers.
   */
  static async getProviderHealth(req: Request, res: Response): Promise<void> {
    const dbStatus = getDatabaseStatus();
    const redisStatus = getRedisStatus();
    const aiHealth = await AiClientService.checkHealth();

    const smtpConfigured = !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
    const twilioConfigured = !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID);
    const factCheckConfigured = !!env.GOOGLE_FACTCHECK_API_KEY;

    res.status(200).json({
      success: true,
      providers: {
        database: {
          name: "MongoDB Atlas / Engine",
          ...dbStatus
        },
        redis: {
          name: "Redis Queue & Cache",
          ...redisStatus
        },
        aiService: {
          name: "Python FastAPI Inference Engine",
          url: env.AI_SERVICE_URL,
          ...aiHealth
        },
        email: {
          name: "SMTP Provider",
          provider: env.EMAIL_PROVIDER_NAME,
          configured: smtpConfigured,
          host: env.SMTP_HOST || "unconfigured"
        },
        sms: {
          name: "Twilio Verify / SMS Provider",
          configured: twilioConfigured,
          senderId: env.SMS_SENDER_ID
        },
        factCheck: {
          name: "Google Fact Check Tools API",
          configured: factCheckConfigured
        }
      }
    });
  }

  /**
   * Returns AI Model Registry catalog with performance metrics.
   */
  static async getModelRegistry(req: Request, res: Response): Promise<void> {
    const catalog = await AiClientService.getModelCatalog();
    res.status(200).json({ success: true, models: catalog });
  }

  /**
   * Retrieves tamper-evident audit log with cryptographic chain verification.
   */
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [events, total, integrity] = await Promise.all([
      AuditEvent.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditEvent.countDocuments(),
      AuditService.verifyChainIntegrity()
    ]);

    res.status(200).json({
      success: true,
      chainIntegrity: integrity,
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  }

  /**
   * Lists async background jobs from queue.
   */
  static async getJobs(req: Request, res: Response): Promise<void> {
    const jobs = await Job.find()
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, jobs });
  }
}
