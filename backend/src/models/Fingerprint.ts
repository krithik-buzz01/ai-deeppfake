import mongoose, { Schema, Document } from "mongoose";

export interface IFingerprint extends Document {
  mediaAssetId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sha256: string;
  pHash: string; // 64-bit hex perceptual hash
  dHash: string; // 64-bit hex difference hash
  aHash?: string; // 64-bit average hash
  colorHistSummary?: number[];
  audioChromaprint?: string;
  filesize: number;
  createdAt: Date;
}

const FingerprintSchema = new Schema<IFingerprint>(
  {
    mediaAssetId: { type: Schema.Types.ObjectId, ref: "MediaAsset", required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sha256: { type: String, required: true, index: true },
    pHash: { type: String, required: true, index: true },
    dHash: { type: String, required: true, index: true },
    aHash: { type: String },
    colorHistSummary: { type: [Number], default: [] },
    audioChromaprint: { type: String },
    filesize: { type: Number, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FingerprintSchema.index({ userId: 1, sha256: 1 });
FingerprintSchema.index({ userId: 1, pHash: 1 });

export const Fingerprint = mongoose.model<IFingerprint>("Fingerprint", FingerprintSchema);
