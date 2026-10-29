import mongoose, { Schema, Document } from "mongoose";

export type C2PAStatus = "verified_provenance" | "invalid_signatures" | "absent_credentials" | "inconclusive";

export interface IProvenanceCheck extends Document {
  analysisId: mongoose.Types.ObjectId;
  hasC2PA: boolean;
  c2paStatus: C2PAStatus;
  manifestIssuer?: string;
  claimGenerator?: string;
  signingAlgorithm?: string;
  signatureValid: boolean;
  certificateChain: Array<{
    issuer: string;
    subject: string;
    validFrom: Date;
    validTo: Date;
  }>;
  exifMetadata: Record<string, any>;
  xmpMetadata: Record<string, any>;
  creationSoftware?: string;
  hardwareDevice?: string;
  tamperingFlags: string[];
  findingsSummary: string;
  disclaimer: string;
}

const ProvenanceCheckSchema = new Schema<IProvenanceCheck>(
  {
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis", required: true, index: true },
    hasC2PA: { type: Boolean, default: false },
    c2paStatus: {
      type: String,
      enum: ["verified_provenance", "invalid_signatures", "absent_credentials", "inconclusive"],
      required: true,
      index: true
    },
    manifestIssuer: { type: String },
    claimGenerator: { type: String },
    signingAlgorithm: { type: String },
    signatureValid: { type: Boolean, default: false },
    certificateChain: [
      {
        issuer: { type: String },
        subject: { type: String },
        validFrom: { type: Date },
        validTo: { type: Date }
      }
    ],
    exifMetadata: { type: Schema.Types.Mixed, default: {} },
    xmpMetadata: { type: Schema.Types.Mixed, default: {} },
    creationSoftware: { type: String },
    hardwareDevice: { type: String },
    tamperingFlags: { type: [String], default: [] },
    findingsSummary: { type: String, required: true },
    disclaimer: {
      type: String,
      default: "Missing Content Credentials or EXIF metadata does not constitute proof of manipulation. Most social platforms intentionally strip metadata during upload."
    }
  },
  { timestamps: true }
);

export const ProvenanceCheck = mongoose.model<IProvenanceCheck>("ProvenanceCheck", ProvenanceCheckSchema);
