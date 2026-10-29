import mongoose, { Schema, Document } from "mongoose";

export type NoteType = "artifact" | "inconsistency" | "false_positive" | "question" | "general";

export interface IAnnotation extends Document {
  caseId: mongoose.Types.ObjectId;
  analysisId?: mongoose.Types.ObjectId;
  analystId: mongoose.Types.ObjectId;
  frameNumber?: number;
  timestampMs?: number;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  noteType: NoteType;
  content: string;
  isDisagreementWithModel: boolean;
  disagreementReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnotationSchema = new Schema<IAnnotation>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis", index: true },
    analystId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    frameNumber: { type: Number },
    timestampMs: { type: Number },
    coordinates: {
      x: { type: Number },
      y: { type: Number },
      width: { type: Number },
      height: { type: Number }
    },
    noteType: {
      type: String,
      enum: ["artifact", "inconsistency", "false_positive", "question", "general"],
      default: "general"
    },
    content: { type: String, required: true, maxlength: 2000 },
    isDisagreementWithModel: { type: Boolean, default: false },
    disagreementReason: { type: String }
  },
  { timestamps: true }
);

export const Annotation = mongoose.model<IAnnotation>("Annotation", AnnotationSchema);
