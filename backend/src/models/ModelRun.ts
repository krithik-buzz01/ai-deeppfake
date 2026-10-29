import mongoose, { Schema, Document } from "mongoose";

export interface IModelRun extends Document {
  analysisId: mongoose.Types.ObjectId;
  modelKey: string;
  modelName: string;
  modelVersion: string;
  modality: "image" | "video" | "audio" | "face" | "lipsync" | "tampering";
  score: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  rawOutput: Record<string, any>;
  executionTimeMs: number;
  isAvailable: boolean;
  createdAt: Date;
}

const ModelRunSchema = new Schema<IModelRun>(
  {
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis", required: true, index: true },
    modelKey: { type: String, required: true },
    modelName: { type: String, required: true },
    modelVersion: { type: String, required: true },
    modality: {
      type: String,
      enum: ["image", "video", "audio", "face", "lipsync", "tampering"],
      required: true
    },
    score: { type: Number, required: true },
    confidenceInterval: {
      lower: { type: Number, default: 0.0 },
      upper: { type: Number, default: 0.0 }
    },
    rawOutput: { type: Schema.Types.Mixed, default: {} },
    executionTimeMs: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ModelRun = mongoose.model<IModelRun>("ModelRun", ModelRunSchema);
