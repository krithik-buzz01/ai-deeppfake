import { Request, Response } from "express";
import crypto from "crypto";
import { ReportVersion } from "../models/ReportVersion.js";
import { ReportShare } from "../models/ReportShare.js";
import { Analysis } from "../models/Analysis.js";
import { MediaAsset } from "../models/MediaAsset.js";
import { AuditEvent } from "../models/AuditEvent.js";
import { PdfReportService } from "../services/pdfReport.service.js";
import { AuditService } from "../services/audit.service.js";

export class ReportController {
  /**
   * Generates a new versioned forensic report for an analysis.
   */
  static async generateReport(req: Request, res: Response): Promise<void> {
    const { analysisId, caseId, title, summary, methodologyNotes } = req.body;

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      res.status(404).json({ success: false, error: "Analysis record not found." });
      return;
    }

    // Authorization
    if (analysis.userId.toString() !== req.user!._id.toString() && req.user!.role === "user") {
      res.status(403).json({ success: false, error: "Access denied." });
      return;
    }

    const lastAudit = await AuditEvent.findOne().sort({ timestamp: -1 });
    const prevAuditHash = lastAudit ? lastAudit.currentHash : "GENESIS";

    const reportNumber = `REP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const tamperChainHash = crypto
      .createHash("sha256")
      .update(`${reportNumber}|${analysis._id}|${analysis.calibratedScore}|${prevAuditHash}`)
      .digest("hex");

    const report = await ReportVersion.create({
      reportNumber,
      analysisId: analysis._id,
      caseId,
      generatedById: req.user!._id,
      versionNumber: 1,
      title: title || `Forensic Analysis Report - ${reportNumber}`,
      summary: summary || analysis.summary,
      tamperChainHash,
      status: "draft",
      methodologyNotes: methodologyNotes || ""
    });

    await AuditService.recordEvent({
      actorId: req.user!._id.toString(),
      actorRole: req.user!.role,
      action: "FORENSIC_REPORT_GENERATED",
      targetResource: "ReportVersion",
      targetId: report._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      details: { reportNumber, tamperChainHash }
    });

    res.status(201).json({ success: true, report });
  }

  /**
   * Streams downloadable forensic PDF report generated on the fly.
   */
  static async downloadPdf(req: Request, res: Response): Promise<void> {
    const reportId = req.params.reportId;
    const report = await ReportVersion.findById(reportId);

    if (!report) {
      res.status(404).json({ success: false, error: "Report not found." });
      return;
    }

    const analysis = await Analysis.findById(report.analysisId);
    if (!analysis) {
      res.status(404).json({ success: false, error: "Associated analysis not found." });
      return;
    }

    const media = await MediaAsset.findById(analysis.mediaAssetId);
    if (!media) {
      res.status(404).json({ success: false, error: "Associated media asset not found." });
      return;
    }

    // Authorization
    if (analysis.userId.toString() !== req.user!._id.toString() && req.user!.role === "user") {
      res.status(403).json({ success: false, error: "Access denied." });
      return;
    }

    const pdfBuffer = await PdfReportService.generateForensicPdf({
      report,
      analysis,
      media,
      analystName: req.user!.fullName
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="VERIFAI_${report.reportNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  }

  /**
   * Approve, reject, or dispute a report (Analyst & Admin only).
   */
  static async approveReport(req: Request, res: Response): Promise<void> {
    const reportId = req.params.reportId;
    const { decision, comments } = req.body;

    if (!["approved", "rejected", "disputed"].includes(decision)) {
      res.status(400).json({ success: false, error: "Invalid approval decision. Must be 'approved', 'rejected', or 'disputed'." });
      return;
    }

    const report = await ReportVersion.findById(reportId);
    if (!report) {
      res.status(404).json({ success: false, error: "Report not found." });
      return;
    }

    report.approvals.push({
      analystId: req.user!._id,
      decision,
      comments: comments || "",
      timestamp: new Date()
    });

    if (decision === "approved") {
      report.status = "approved";
    } else if (decision === "disputed") {
      report.status = "disputed";
    }

    await report.save();

    await AuditService.recordEvent({
      actorId: req.user!._id.toString(),
      actorRole: req.user!.role,
      action: `REPORT_${decision.toUpperCase()}`,
      targetResource: "ReportVersion",
      targetId: report._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      details: { decision, comments }
    });

    res.status(200).json({ success: true, report });
  }

  /**
   * Generates a secure share link for authorized report viewing.
   */
  static async shareReport(req: Request, res: Response): Promise<void> {
    const reportId = req.params.reportId;
    const { sharedWithEmail, permission, expiryDays } = req.body;

    if (!sharedWithEmail) {
      res.status(400).json({ success: false, error: "Recipient email is required." });
      return;
    }

    const report = await ReportVersion.findById(reportId);
    if (!report) {
      res.status(404).json({ success: false, error: "Report not found." });
      return;
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    const shareTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + (expiryDays || 7) * 24 * 60 * 60 * 1000);

    const share = await ReportShare.create({
      reportVersionId: report._id,
      sharedById: req.user!._id,
      sharedWithEmail: sharedWithEmail.toLowerCase().trim(),
      shareTokenHash,
      permission: permission || "view",
      expiresAt
    });

    res.status(201).json({
      success: true,
      shareUrl: `${req.protocol}://${req.get("host")}/api/v1/reports/shared/${rawToken}`,
      expiresAt
    });
  }

  /**
   * Verifies the cryptographic chain of custody for a given report.
   */
  static async getTamperChain(req: Request, res: Response): Promise<void> {
    const reportId = req.params.reportId;
    const report = await ReportVersion.findById(reportId);

    if (!report) {
      res.status(404).json({ success: false, error: "Report not found." });
      return;
    }

    const chainIntegrity = await AuditService.verifyChainIntegrity();

    res.status(200).json({
      success: true,
      reportNumber: report.reportNumber,
      tamperChainHash: report.tamperChainHash,
      chainIntegrity
    });
  }
}
