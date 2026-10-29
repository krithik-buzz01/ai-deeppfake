import mongoose, { Schema, Document } from "mongoose";

export type AssetStatus = "uploaded" | "queued" | "processing" | "completed" | "failed";
export type AssetModality = "image" | "video" | "audio";

export interface IMediaAsset extends Document {
  userId: mongoose.Types.ObjectId;
  originalFilename: string;
  sanitizedFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  sha256Hash: string;
  pHash?: string;
  dHash?: string;
  status: AssetStatus;
  modality: AssetModality;
  durationSeconds?: number;
  width?: number;
  height?: number;
  isLiveCapture: boolean;
  consentGiven: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalFilename: { type: String, required: true },
    sanitizedFilename: { type: String, required: true },
    mimeType: { type: String, required: true, index: true },
    sizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true, unique: true },
    sha256Hash: { type: String, required: true, index: true },
    pHash: { type: String, index: true },
    dHash: { type: String, index: true },
    status: {
      type: String,
      enum: ["uploaded", "queued", "processing", "completed", "failed"],
      default: "uploaded",
      index: true
    },
    modality: { type: String, enum: ["image", "video", "audio"], required: true, index: true },
    durationSeconds: { type: Number },
    width: { type: Number },
    height: { type: Number },
    isLiveCapture: { type: Boolean, default: false },
    consentGiven: { type: Boolean, default: true }
  },
  { timestamps: true }
);

MediaAssetSchema.index({ userId: 1, createdAt: -1 });

export const MediaAsset = mongoose.model<IMediaAsset>("MediaAsset", MediaAssetSchema);
