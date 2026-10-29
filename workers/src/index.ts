import { Worker, Job as BullJob } from "bullmq";
import { getRedisClient } from "../../backend/src/config/redis.js";
import { Job } from "../../backend/src/models/Job.js";
import { MediaAsset } from "../../backend/src/models/MediaAsset.js";
import { Analysis } from "../../backend/src/models/Analysis.js";
import { AuditService } from "../../backend/src/services/audit.service.js";
import { AiClientService } from "../../backend/src/services/aiClient.service.js";
import { C2PAService } from "../../backend/src/services/c2pa.service.js";
import fs from "fs";
import path from "path";

const VAULT_DIR = path.resolve("./vault");

export function startMediaWorker() {
  const redis = getRedisClient();

  const worker = new Worker(
    "media-forensic-queue",
    async (job: BullJob) => {
      console.log(`[Worker] Processing Job #${job.id}: ${job.name}`);
      const { mediaAssetId, userId, idempotencyKey } = job.data;

      // Update Job model in MongoDB
      const dbJob = await Job.findOne({ bullJobId: job.id?.toString() });
      if (dbJob) {
        dbJob.status = "active";
        dbJob.startedAt = new Date();
        dbJob.progress = 10;
        await dbJob.save();
      }

      const asset = await MediaAsset.findById(mediaAssetId);
      if (!asset) {
        throw new Error(`MediaAsset ${mediaAssetId} not found`);
      }

      const filePath = path.join(VAULT_DIR, asset.sanitizedFilename);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Physical media file absent from vault`);
      }

      const buffer = fs.readFileSync(filePath);

      // C2PA Check
      job.updateProgress(30);
      const prov = C2PAService.inspectProvenance(buffer);

      // AI Inference
      job.updateProgress(60);
      let aiRes: any = {};
      if (asset.modality === "image") {
        aiRes = await AiClientService.analyzeImage(buffer, asset.originalFilename);
      } else if (asset.modality === "video") {
        aiRes = await AiClientService.analyzeVideo(buffer, asset.originalFilename);
      } else if (asset.modality === "audio") {
        aiRes = await AiClientService.analyzeAudio(buffer, asset.originalFilename);
      }

      job.updateProgress(90);

      // Save Analysis
      const score = aiRes.deepfake_analysis?.calibrated_score || aiRes.video_forensics?.overall_video_score || aiRes.audio_forensics?.synthetic_voice_score || 0.0;
      let risk: "low" | "medium" | "high" | "critical" = "low";
      if (score > 0.75) risk = "critical";
      else if (score > 0.50) risk = "high";
      else if (score > 0.25) risk = "medium";

      const analysis = await Analysis.create({
        mediaAssetId: asset._id,
        userId,
        status: "completed",
        overallRisk: risk,
        confidenceScore: score,
        calibratedScore: score,
        confidenceInterval: { lower: Math.max(0, score - 0.05), upper: Math.min(1, score + 0.05) },
        summary: `Batch forensic processing completed with calibrated score of ${(score * 100).toFixed(1)}%.`,
        supportedModalities: [asset.modality],
        durationMs: aiRes.executionTimeMs || 1000
      });

      asset.status = "completed";
      await asset.save();

      if (dbJob) {
        dbJob.status = "completed";
        dbJob.progress = 100;
        dbJob.analysisId = analysis._id;
        dbJob.completedAt = new Date();
        await dbJob.save();
      }

      console.log(`[Worker] Completed Job #${job.id} for Asset ${asset.originalFilename}`);
      return { success: true, analysisId: analysis._id };
    },
    {
      connection: redis as any,
      concurrency: 3
    }
  );

  worker.on("failed", async (job, err) => {
    console.error(`[Worker] Job #${job?.id} failed: ${err.message}`);
    if (job) {
      await Job.findOneAndUpdate(
        { bullJobId: job.id?.toString() },
        { status: "failed", error: err.message }
      );
    }
  });

  console.log("[Worker] Media forensic worker started on queue 'media-forensic-queue'.");
  return worker;
}

if (process.env.RUN_WORKER_DIRECT === "true") {
  startMediaWorker();
}
