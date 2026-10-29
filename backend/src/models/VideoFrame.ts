import mongoose, { Schema, Document } from "mongoose";

export interface IVideoFrame extends Document {
  analysisId: mongoose.Types.ObjectId;
  frameNumber: number;
  timestampMs: number;
  suspicionScore: number;
  temporalFlicker: number;
  facesDetected: number;
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    suspicionScore: number;
  }>;
  riskLevel: string;
}

const VideoFrameSchema = new Schema<IVideoFrame>(
  {
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis", required: true, index: true },
    frameNumber: { type: Number, required: true },
    timestampMs: { type: Number, required: true, index: true },
    suspicionScore: { type: Number, required: true },
    temporalFlicker: { type: Number, default: 0 },
    facesDetected: { type: Number, default: 0 },
    boundingBoxes: [
      {
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number },
        suspicionScore: { type: Number }
      }
    ],
    riskLevel: { type: String, default: "low" }
  },
  { timestamps: true }
);

VideoFrameSchema.index({ analysisId: 1, timestampMs: 1 });

export const VideoFrame = mongoose.model<IVideoFrame>("VideoFrame", VideoFrameSchema);
