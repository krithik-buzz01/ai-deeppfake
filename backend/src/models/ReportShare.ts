import mongoose, { Schema, Document } from "mongoose";

export interface IReportShare extends Document {
  reportVersionId: mongoose.Types.ObjectId;
  sharedById: mongoose.Types.ObjectId;
  sharedWithEmail: string;
  shareTokenHash: string;
  permission: "view" | "download";
  expiresAt: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  revoked: boolean;
  createdAt: Date;
}

const ReportShareSchema = new Schema<IReportShare>(
  {
    reportVersionId: { type: Schema.Types.ObjectId, ref: "ReportVersion", required: true, index: true },
    sharedById: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sharedWithEmail: { type: String, required: true, lowercase: true, trim: true },
    shareTokenHash: { type: String, required: true, unique: true, index: true },
    permission: { type: String, enum: ["view", "download"], default: "view" },
    expiresAt: { type: Date, required: true, index: true },
    accessCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
    revoked: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ReportShare = mongoose.model<IReportShare>("ReportShare", ReportShareSchema);
