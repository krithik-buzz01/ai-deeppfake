import { Request, Response } from "express";
import { ClaimCheck } from "../models/ClaimCheck.js";
import { ClaimService } from "../services/claim.service.js";
import { AuditService } from "../services/audit.service.js";

export class ClaimController {
  /**
   * Submits a factual assertion for independent claim verification.
   */
  static async verifyClaim(req: Request, res: Response): Promise<void> {
    const { claimText, analysisId, claimCategory } = req.body;

    if (!claimText || typeof claimText !== "string") {
      res.status(400).json({ success: false, error: "Claim text is required." });
      return;
    }

    const verification = await ClaimService.verifyClaim(claimText);

    const claimCheck = await ClaimCheck.create({
      userId: req.user!._id,
      analysisId,
      claimText: claimText.trim(),
      claimCategory: claimCategory || "general",
      verificationStatus: verification.status,
      evidenceList: verification.evidenceList,
      providerUsed: verification.providerUsed,
      notes: verification.notes
    });

    await AuditService.recordEvent({
      actorId: req.user!._id.toString(),
      actorRole: req.user!.role,
      action: "CLAIM_VERIFIED",
      targetResource: "ClaimCheck",
      targetId: claimCheck._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      details: {
        claimText: claimText.substring(0, 100),
        status: verification.status,
        evidenceCount: verification.evidenceList.length
      }
    });

    res.status(200).json({
      success: true,
      claimCheck
    });
  }

  /**
   * Lists claim checks submitted by user.
   */
  static async listClaims(req: Request, res: Response): Promise<void> {
    const claims = await ClaimCheck.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, claims });
  }
}
