import mongoose, { Schema, Document } from "mongoose";

export type CasePriority = "low" | "medium" | "high" | "urgent";
export type CaseStatus = "open" | "in_investigation" | "pending_review" | "closed";

export interface ICase extends Document {
  caseNumber: string;
  title: string;
  description: string;
  createdById: mongoose.Types.ObjectId;
  assignedAnalystId?: mongoose.Types.ObjectId;
  collaboratorIds: mongoose.Types.ObjectId[];
  priority: CasePriority;
  status: CaseStatus;
  mediaAssetIds: mongoose.Types.ObjectId[];
  analysisIds: mongoose.Types.ObjectId[];
  humanVerdict?: "authentic" | "manipulated" | "inconclusive" | "disputed";
  verdictRationale?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>(
  {
    caseNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "" },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedAnalystId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    collaboratorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true
    },
    status: {
      type: String,
      enum: ["open", "in_investigation", "pending_review", "closed"],
      default: "open",
      index: true
    },
    mediaAssetIds: [{ type: Schema.Types.ObjectId, ref: "MediaAsset" }],
    analysisIds: [{ type: Schema.Types.ObjectId, ref: "Analysis" }],
    humanVerdict: {
      type: String,
      enum: ["authentic", "manipulated", "inconclusive", "disputed"]
    },
    verdictRationale: { type: String },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const Case = mongoose.model<ICase>("Case", CaseSchema);
