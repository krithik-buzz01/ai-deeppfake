import mongoose, { Schema, Document } from "mongoose";

export interface IAudioSegment extends Document {
  analysisId: mongoose.Types.ObjectId;
  startMs: number;
  endMs: number;
  syntheticScore: number;
  pitchJitter: number;
  amplitudeShimmer: number;
  spectralCentroid: number;
  spectralFlatness: number;
  anomalies: string[];
}

const AudioSegmentSchema = new Schema<IAudioSegment>(
  {
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis", required: true, index: true },
    startMs: { type: Number, required: true },
    endMs: { type: Number, required: true },
    syntheticScore: { type: Number, required: true },
    pitchJitter: { type: Number, default: 0 },
    amplitudeShimmer: { type: Number, default: 0 },
    spectralCentroid: { type: Number, default: 0 },
    spectralFlatness: { type: Number, default: 0 },
    anomalies: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const AudioSegment = mongoose.model<IAudioSegment>("AudioSegment", AudioSegmentSchema);
