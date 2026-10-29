import mongoose, { Schema, Document } from "mongoose";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AnalysisStatus = "queued" | "running" | "completed" | "failed";

export interface IAnalysis extends Document {
  mediaAssetId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: AnalysisStatus;
  overallRisk: RiskLevel;
  confidenceScore: number;
  calibratedScore: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  summary: string;
  crossModalSynthesis: {
    videoScore?: number;
    imageScore?: number;
    audioScore?: number;
    lipsyncScore?: number;
    provenanceScore?: number;
    tamperingScore?: number;
    conflictsDetected: string[];
    isConclusive: boolean;
  };
  supportedModalities: string[];
  detectedSignals: string[];
  limitations: string;
  durationMs: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    mediaAssetId: { type: Schema.Types.ObjectId, ref: "MediaAsset", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
      index: true
    },
    overallRisk: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
      index: true
    },
    confidenceScore: { type: Number, default: 0.0 },
    calibratedScore: { type: Number, default: 0.0, index: true },
    confidenceInterval: {
      lower: { type: Number, default: 0.0 },
      upper: { type: Number, default: 0.0 }
    },
    summary: { type: String, default: "" },
    crossModalSynthesis: {
      videoScore: { type: Number },
      imageScore: { type: Number },
      audioScore: { type: Number },
      lipsyncScore: { type: Number },
      provenanceScore: { type: Number },
      tamperingScore: { type: Number },
      conflictsDetected: { type: [String], default: [] },
      isConclusive: { type: Boolean, default: true }
    },
    supportedModalities: { type: [String], default: [] },
    detectedSignals: { type: [String], default: [] },
    limitations: { type: String, default: "" },
    durationMs: { type: Number, default: 0 },
    error: { type: String }
  },
  { timestamps: true }
);

AnalysisSchema.index({ userId: 1, createdAt: -1 });

export const Analysis = mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
