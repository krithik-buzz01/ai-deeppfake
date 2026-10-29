import mongoose, { Schema, Document } from "mongoose";

export type JobType = "single_analysis" | "batch_analysis" | "frame_extraction" | "pdf_generation";
export type JobStatus = "queued" | "active" | "completed" | "failed" | "cancelled";

export interface IJob extends Document {
  bullJobId?: string;
  userId: mongoose.Types.ObjectId;
  jobType: JobType;
  status: JobStatus;
  progress: number; // 0 to 100
  batchId?: string;
  mediaAssetId?: mongoose.Types.ObjectId;
  analysisId?: mongoose.Types.ObjectId;
  error?: string;
  attempts: number;
  maxAttempts: number;
  idempotencyKey?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    bullJobId: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobType: {
      type: String,
      enum: ["single_analysis", "batch_analysis", "frame_extraction", "pdf_generation"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["queued", "active", "completed", "failed", "cancelled"],
      default: "queued",
      index: true
    },
    progress: { type: Number, default: 0 },
    batchId: { type: String, index: true },
    mediaAssetId: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis" },
    error: { type: String },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    idempotencyKey: { type: String, unique: true, sparse: true },
    startedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

JobSchema.index({ userId: 1, createdAt: -1 });

export const Job = mongoose.model<IJob>("Job", JobSchema);
