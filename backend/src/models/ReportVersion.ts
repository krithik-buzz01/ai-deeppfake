import mongoose, { Schema, Document } from "mongoose";

export type ReportStatus = "draft" | "under_review" | "approved" | "disputed";

export interface IReportApproval {
  analystId: mongoose.Types.ObjectId;
  decision: "approved" | "rejected" | "disputed";
  comments: string;
  timestamp: Date;
}

export interface IReportVersion extends Document {
  reportNumber: string;
  analysisId: mongoose.Types.ObjectId;
  caseId?: mongoose.Types.ObjectId;
  generatedById: mongoose.Types.ObjectId;
  versionNumber: number;
  title: string;
  summary: string;
  pdfStorageKey?: string;
  tamperChainHash: string; // Hash of the report content chained with prior event
  status: ReportStatus;
  approvals: IReportApproval[];
  methodologyNotes: string;
  disclaimer: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportVersionSchema = new Schema<IReportVersion>(
  {
    reportNumber: { type: String, required: true, unique: true, index: true },
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis", required: true, index: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case", index: true },
    generatedById: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    versionNumber: { type: Number, default: 1 },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    pdfStorageKey: { type: String },
    tamperChainHash: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "under_review", "approved", "disputed"],
      default: "draft",
      index: true
    },
    approvals: [
      {
        analystId: { type: Schema.Types.ObjectId, ref: "User" },
        decision: { type: String, enum: ["approved", "rejected", "disputed"] },
        comments: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    methodologyNotes: { type: String, default: "" },
    disclaimer: {
      type: String,
      default: "This report is generated using probabilistic AI models and algorithmic forensic heuristics. It does not constitute legally conclusive proof or certified court testimony without independent forensic validation."
    }
  },
  { timestamps: true }
);

export const ReportVersion = mongoose.model<IReportVersion>("ReportVersion", ReportVersionSchema);
