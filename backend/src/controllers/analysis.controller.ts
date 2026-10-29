import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { MediaAsset } from "../models/MediaAsset.js";
import { Analysis } from "../models/Analysis.js";
import { ModelRun } from "../models/ModelRun.js";
import { VideoFrame } from "../models/VideoFrame.js";
import { AudioSegment } from "../models/AudioSegment.js";
import { ProvenanceCheck } from "../models/ProvenanceCheck.js";
import { AiClientService } from "../services/aiClient.service.js";
import { C2PAService } from "../services/c2pa.service.js";
import { AuditService } from "../services/audit.service.js";

const VAULT_DIR = path.resolve("./vault");

export class AnalysisController {
  /**
   * Submits a media asset for comprehensive multimodal forensic analysis.
   */
  static async submitAnalysis(req: Request, res: Response): Promise<void> {
    const assetId = req.params.assetId;
    const asset = await MediaAsset.findById(assetId);

    if (!asset) {
      res.status(404).json({ success: false, error: "Media asset not found." });
      return;
    }

    // Ownership authorization check
    if (asset.userId.toString() !== req.user!._id.toString() && req.user!.role === "user") {
      res.status(403).json({ success: false, error: "Access denied. You can only analyze your authorized media." });
      return;
    }

    const filePath = path.join(VAULT_DIR, asset.sanitizedFilename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: "Physical media file missing from vault." });
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const startTime = Date.now();

    // 1. Initial C2PA and Provenance inspection
    const provenanceResult = C2PAService.inspectProvenance(fileBuffer);

    // Create Analysis record in 'running' state
    const analysis = await Analysis.create({
      mediaAssetId: asset._id,
      userId: req.user!._id,
      status: "running",
      supportedModalities: [asset.modality],
      detectedSignals: [],
      crossModalSynthesis: {
        conflictsDetected: [],
        isConclusive: true
      }
    });

    // Save Provenance record
    await ProvenanceCheck.create({
      analysisId: analysis._id,
      hasC2PA: provenanceResult.hasC2PA,
      c2paStatus: provenanceResult.c2paStatus,
      manifestIssuer: provenanceResult.manifestIssuer,
      claimGenerator: provenanceResult.claimGenerator,
      signingAlgorithm: provenanceResult.signingAlgorithm,
      signatureValid: provenanceResult.signatureValid,
      certificateChain: provenanceResult.certificateChain,
      exifMetadata: provenanceResult.exifMetadata,
      xmpMetadata: provenanceResult.xmpMetadata,
      creationSoftware: provenanceResult.creationSoftware,
      hardwareDevice: provenanceResult.hardwareDevice,
      tamperingFlags: provenanceResult.tamperingFlags,
      findingsSummary: provenanceResult.findingsSummary
    });

    try {
      let overallScore = 0.0;
      let detectedSignals: string[] = [];
      const crossModal: any = {
        conflictsDetected: [],
        isConclusive: true
      };

      if (provenanceResult.tamperingFlags.length > 0) {
        detectedSignals.push(...provenanceResult.tamperingFlags);
      }

      // ================= MODALITY SPECIFIC INFERENCE =================
      if (asset.modality === "image") {
        const aiRes = await AiClientService.analyzeImage(fileBuffer, asset.originalFilename);
        const deepfake = aiRes.deepfake_analysis || {};
        const faceLoc = aiRes.face_localization || {};
        const tampering = aiRes.tampering_analysis || {};

        overallScore = deepfake.calibrated_score || 0.0;
        if (deepfake.detected_signals) {
          detectedSignals.push(...deepfake.detected_signals);
        }

        crossModal.imageScore = overallScore;
        crossModal.tamperingScore = tampering.tampering_score || 0.0;

        // Record Image Model Run
        await ModelRun.create({
          analysisId: analysis._id,
          modelKey: "verifai-vision-vit",
          modelName: "Vision Transformer Deepfake & Artifact Detector",
          modelVersion: "1.4.0",
          modality: "image",
          score: deepfake.calibrated_score || 0.0,
          confidenceInterval: deepfake.confidence_interval || { lower: 0.0, upper: 0.0 },
          rawOutput: deepfake,
          executionTimeMs: aiRes.executionTimeMs || 0
        });

        // Record Tampering Model Run
        await ModelRun.create({
          analysisId: analysis._id,
          modelKey: "verifai-tampering-ela",
          modelName: "Digital Tampering & Forensic Noise Consistency Analyzer",
          modelVersion: "2.0.0",
          modality: "tampering",
          score: tampering.tampering_score || 0.0,
          confidenceInterval: { lower: Math.max(0, tampering.tampering_score - 0.05), upper: Math.min(1, tampering.tampering_score + 0.05) },
          rawOutput: tampering,
          executionTimeMs: aiRes.executionTimeMs || 0
        });

        // Record Face Localization if available
        if (faceLoc.localization_available) {
          await ModelRun.create({
            analysisId: analysis._id,
            modelKey: "verifai-face-localizer",
            modelName: "Multi-Scale Face Manipulation & Heatmap Localizer",
            modelVersion: "1.3.1",
            modality: "face",
            score: faceLoc.max_face_suspicion || 0.0,
            confidenceInterval: { lower: 0.0, upper: 1.0 },
            rawOutput: faceLoc,
            executionTimeMs: aiRes.executionTimeMs || 0
          });
        }
      } else if (asset.modality === "video") {
        const aiRes = await AiClientService.analyzeVideo(fileBuffer, asset.originalFilename);
        const videoRes = aiRes.video_forensics || {};

        overallScore = videoRes.overall_video_score || 0.0;
        crossModal.videoScore = overallScore;

        if (videoRes.suspicious_segments && videoRes.suspicious_segments.length > 0) {
          detectedSignals.push(`Detected ${videoRes.suspicious_segments.length} temporal anomaly segment(s) exhibiting elevated inter-frame divergence.`);
        }

        // Save Video Model Run
        await ModelRun.create({
          analysisId: analysis._id,
          modelKey: "verifai-video-temporal",
          modelName: "Adaptive Temporal Inconsistency Forensics",
          modelVersion: "1.2.0",
          modality: "video",
          score: overallScore,
          confidenceInterval: { lower: Math.max(0, overallScore - 0.06), upper: Math.min(1, overallScore + 0.06) },
          rawOutput: videoRes,
          executionTimeMs: aiRes.executionTimeMs || 0
        });

        // Save sampled video frames for timeline inspection
        if (videoRes.frames_sample && Array.isArray(videoRes.frames_sample)) {
          for (const f of videoRes.frames_sample) {
            await VideoFrame.create({
              analysisId: analysis._id,
              frameNumber: f.frame_number,
              timestampMs: f.timestamp_ms,
              suspicionScore: f.suspicionScore || f.suspicion_score || 0.0,
              temporalFlicker: f.temporal_flicker || 0.0,
              facesDetected: f.faces_detected || 0,
              riskLevel: f.risk_level || "low"
            });
          }
        }
      } else if (asset.modality === "audio") {
        const aiRes = await AiClientService.analyzeAudio(fileBuffer, asset.originalFilename);
        const audioRes = aiRes.audio_forensics || {};

        overallScore = audioRes.synthetic_voice_score || 0.0;
        crossModal.audioScore = overallScore;

        if (audioRes.detected_anomalies && audioRes.detected_anomalies.length > 0) {
          detectedSignals.push(...audioRes.detected_anomalies);
        }

        // Save Audio Model Run
        await ModelRun.create({
          analysisId: analysis._id,
          modelKey: "verifai-voice-synthetics",
          modelName: "Acoustic Spectral & Synthetic Voice Detector",
          modelVersion: "1.1.0",
          modality: "audio",
          score: overallScore,
          confidenceInterval: { lower: Math.max(0, overallScore - 0.05), upper: Math.min(1, overallScore + 0.05) },
          rawOutput: audioRes,
          executionTimeMs: aiRes.executionTimeMs || 0
        });

        // Save synthetic audio segment
        await AudioSegment.create({
          analysisId: analysis._id,
          startMs: 0,
          endMs: Math.round((audioRes.duration_seconds || 1.0) * 1000),
          syntheticScore: overallScore,
          pitchJitter: audioRes.pitch_jitter || 0.0,
          amplitudeShimmer: audioRes.amplitude_shimmer || 0.0,
          spectralCentroid: audioRes.mean_spectral_centroid_hz || 0.0,
          spectralFlatness: audioRes.spectral_flatness || 0.0,
          anomalies: audioRes.detected_anomalies || []
        });
      }

      // Feature 8: Cross-Modal Consistency Intelligence
      // Check for conflicts between provenance and AI score
      if (provenanceResult.c2paStatus === "verified_provenance" && overallScore > 0.50) {
        crossModal.conflictsDetected.push("Conflict Detected: C2PA signature verified as authentic hardware capture, but acoustic/visual neural classifiers flagged anomalies.");
        crossModal.isConclusive = false;
      }

      // Live capture check disclaimer
      if (asset.isLiveCapture) {
        detectedSignals.push("Direct browser camera capture authenticated; camera capture alone does not certify biometric liveness or subject identity.");
      }

      // Risk level mapping
      let risk: "low" | "medium" | "high" | "critical" = "low";
      if (overallScore > 0.75) risk = "critical";
      else if (overallScore > 0.50) risk = "high";
      else if (overallScore > 0.25) risk = "medium";

      // Finalize Analysis
      const durationMs = Date.now() - startTime;
      analysis.status = "completed";
      analysis.overallRisk = risk;
      analysis.calibratedScore = overallScore;
      analysis.confidenceScore = overallScore;
      analysis.confidenceInterval = {
        lower: Math.max(0.0, Math.round((overallScore - 0.05) * 1000) / 1000),
        upper: Math.min(1.0, Math.round((overallScore + 0.05) * 1000) / 1000)
      };
      analysis.summary = `Forensic evaluation completed with calibrated manipulation probability of ${(overallScore * 100).toFixed(1)}% (${risk.toUpperCase()} RISK).`;
      analysis.detectedSignals = detectedSignals;
      analysis.crossModalSynthesis = crossModal;
      analysis.durationMs = durationMs;
      analysis.limitations = "AI scores reflect probabilistic statistical metrics, not legal proof of authenticity. Compression, transmission jitter, and low resolution can affect findings.";
      await analysis.save();

      asset.status = "completed";
      await asset.save();

      await AuditService.recordEvent({
        actorId: req.user!._id.toString(),
        actorRole: req.user!.role,
        action: "ANALYSIS_COMPLETED",
        targetResource: "Analysis",
        targetId: analysis._id.toString(),
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"],
        details: {
          assetId: asset._id.toString(),
          calibratedScore: overallScore,
          risk,
          durationMs
        }
      });

      res.status(200).json({
        success: true,
        message: "Analysis executed successfully.",
        analysis
      });
    } catch (err: any) {
      analysis.status = "failed";
      analysis.error = err.message;
      await analysis.save();

      asset.status = "failed";
      await asset.save();

      res.status(500).json({ success: false, error: `Inference failed: ${err.message}` });
    }
  }

  /**
   * Retrieves full analysis details including runs, frames, and provenance.
   */
  static async getAnalysis(req: Request, res: Response): Promise<void> {
    const analysisId = req.params.analysisId;
    const analysis = await Analysis.findById(analysisId).populate("mediaAssetId");

    if (!analysis) {
      res.status(404).json({ success: false, error: "Analysis record not found." });
      return;
    }

    // Ownership or Analyst authorization
    if (analysis.userId.toString() !== req.user!._id.toString() && req.user!.role === "user") {
      res.status(403).json({ success: false, error: "Access denied. You may only view your authorized analyses." });
      return;
    }

    const modelRuns = await ModelRun.find({ analysisId: analysis._id });
    const videoFrames = await VideoFrame.find({ analysisId: analysis._id }).sort({ timestampMs: 1 });
    const audioSegments = await AudioSegment.find({ analysisId: analysis._id }).sort({ startMs: 1 });
    const provenance = await ProvenanceCheck.findOne({ analysisId: analysis._id });

    res.status(200).json({
      success: true,
      analysis,
      modelRuns,
      videoFrames,
      audioSegments,
      provenance
    });
  }

  /**
   * Lists analyses for the authenticated user.
   */
  static async listUserAnalyses(req: Request, res: Response): Promise<void> {
    const analyses = await Analysis.find({ userId: req.user!._id })
      .populate("mediaAssetId")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      analyses
    });
  }
}
