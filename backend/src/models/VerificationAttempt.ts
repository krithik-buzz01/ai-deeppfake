import mongoose, { Schema, Document } from "mongoose";

export type VerificationType = "email_otp" | "sms_otp" | "password_reset";

export interface IVerificationAttempt extends Document {
  target: string; // Email or E.164 phone number
  type: VerificationType;
  codeHash: string; // Keyed HMAC-SHA256 hash of OTP
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  resendAfter: Date;
  ip: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationAttemptSchema = new Schema<IVerificationAttempt>(
  {
    target: { type: String, required: true, index: true },
    type: { type: String, enum: ["email_otp", "sms_otp", "password_reset"], required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: "10m" } }, // Automatic TTL cleanup after 10 minutes
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    verified: { type: Boolean, default: false },
    resendAfter: { type: Date, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String }
  },
  { timestamps: true }
);

// Compound index for querying active target attempts
VerificationAttemptSchema.index({ target: 1, type: 1, verified: 1 });

export const VerificationAttempt = mongoose.model<IVerificationAttempt>("VerificationAttempt", VerificationAttemptSchema);
