import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  userAgent?: string;
  ip: string;
  isValid: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String, required: true },
    isValid: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: "30d" } }
  },
  { timestamps: true }
);

export const Session = mongoose.model<ISession>("Session", SessionSchema);
