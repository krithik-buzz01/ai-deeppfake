import mongoose, { Schema, Document } from "mongoose";

export interface IClaimEvidence {
  sourceTitle: string;
  sourceUrl: string;
  publisher: string;
  publishDate?: string;
  rating?: string;
  textSnippet: string;
  relevanceScore: number;
}

export interface IClaimCheck extends Document {
  userId: mongoose.Types.ObjectId;
  analysisId?: mongoose.Types.ObjectId;
  claimText: string;
  claimCategory: string;
  verificationStatus: "verified" | "disputed" | "unverified" | "provider_unavailable";
  evidenceList: IClaimEvidence[];
  providerUsed: string;
  notes: string;
  disclaimer: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimCheckSchema = new Schema<IClaimCheck>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis", index: true },
    claimText: { type: String, required: true, maxlength: 1000 },
    claimCategory: { type: String, default: "general" },
    verificationStatus: {
      type: String,
      enum: ["verified", "disputed", "unverified", "provider_unavailable"],
      default: "unverified",
      index: true
    },
    evidenceList: [
      {
        sourceTitle: { type: String, required: true },
        sourceUrl: { type: String, required: true },
        publisher: { type: String, required: true },
        publishDate: { type: String },
        rating: { type: String },
        textSnippet: { type: String, required: true },
        relevanceScore: { type: Number, default: 0.0 }
      }
    ],
    providerUsed: { type: String, default: "Google Fact Check Tools API / Verified Open Fact Index" },
    notes: { type: String, default: "" },
    disclaimer: {
      type: String,
      default: "Claim verification evaluates factual assertion history in public fact-checking repositories. It is strictly independent of AI deepfake classification."
    }
  },
  { timestamps: true }
);

export const ClaimCheck = mongoose.model<IClaimCheck>("ClaimCheck", ClaimCheckSchema);
