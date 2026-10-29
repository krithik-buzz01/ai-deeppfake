import { Request, Response } from "express";
import crypto from "crypto";
import { Case } from "../models/Case.js";
import { Annotation } from "../models/Annotation.js";
import { AuditService } from "../services/audit.service.js";

export class CaseController {
  /**
   * Lists investigation cases for analysts and admins.
   */
  static async listCases(req: Request, res: Response): Promise<void> {
    const { status, priority } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const cases = await Case.find(filter)
      .populate("createdById", "fullName email role")
      .populate("assignedAnalystId", "fullName email")
      .populate("mediaAssetIds")
      .sort({ updatedAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, cases });
  }

  /**
   * Creates an investigation case.
   */
  static async createCase(req: Request, res: Response): Promise<void> {
    const { title, description, priority, mediaAssetIds, analysisIds, tags } = req.body;

    if (!title) {
      res.status(400).json({ success: false, error: "Case title is required." });
      return;
    }

    const caseNumber = `CASE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const newCase = await Case.create({
      caseNumber,
      title,
      description: description || "",
      createdById: req.user!._id,
      assignedAnalystId: req.user!._id,
      priority: priority || "medium",
      status: "open",
      mediaAssetIds: mediaAssetIds || [],
      analysisIds: analysisIds || [],
      tags: tags || []
    });

    await AuditService.recordEvent({
      actorId: req.user!._id.toString(),
      actorRole: req.user!.role,
      action: "CASE_CREATED",
      targetResource: "Case",
      targetId: newCase._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      details: { caseNumber, title }
    });

    res.status(201).json({ success: true, case: newCase });
  }

  /**
   * Get case details with annotations and associated evidence.
   */
  static async getCase(req: Request, res: Response): Promise<void> {
    const caseId = req.params.caseId;
    const caseDoc = await Case.findById(caseId)
      .populate("createdById", "fullName email role")
      .populate("assignedAnalystId", "fullName email")
      .populate("mediaAssetIds")
      .populate("analysisIds");

    if (!caseDoc) {
      res.status(404).json({ success: false, error: "Case not found." });
      return;
    }

    const annotations = await Annotation.find({ caseId: caseDoc._id })
      .populate("analystId", "fullName email")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, case: caseDoc, annotations });
  }

  /**
   * Add an annotation or record a human disagreement with an AI model.
   * Human review never silently overwrites model outputs.
   */
  static async addAnnotation(req: Request, res: Response): Promise<void> {
    const caseId = req.params.caseId;
    const {
      analysisId,
      frameNumber,
      timestampMs,
      coordinates,
      noteType,
      content,
      isDisagreementWithModel,
      disagreementReason
    } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: "Annotation content is required." });
      return;
    }

    const annotation = await Annotation.create({
      caseId,
      analysisId,
      analystId: req.user!._id,
      frameNumber,
      timestampMs,
      coordinates,
      noteType: noteType || "general",
      content,
      isDisagreementWithModel: !!isDisagreementWithModel,
      disagreementReason
    });

    await AuditService.recordEvent({
      actorId: req.user!._id.toString(),
      actorRole: req.user!.role,
      action: "CASE_ANNOTATION_ADDED",
      targetResource: "Annotation",
      targetId: annotation._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      details: { caseId, isDisagreementWithModel }
    });

    res.status(201).json({ success: true, annotation });
  }

  /**
   * Record human verdict rationale on case.
   */
  static async updateVerdict(req: Request, res: Response): Promise<void> {
    const caseId = req.params.caseId;
    const { verdict, rationale, status } = req.body;

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      res.status(404).json({ success: false, error: "Case not found." });
      return;
    }

    if (verdict) caseDoc.humanVerdict = verdict;
    if (rationale) caseDoc.verdictRationale = rationale;
    if (status) caseDoc.status = status;

    await caseDoc.save();

    await AuditService.recordEvent({
      actorId: req.user!._id.toString(),
      actorRole: req.user!.role,
      action: "CASE_VERDICT_UPDATED",
      targetResource: "Case",
      targetId: caseDoc._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      details: { verdict, status }
    });

    res.status(200).json({ success: true, case: caseDoc });
  }
}
