import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "user" | "analyst" | "admin";

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  failedLoginAttempts: number;
  lockUntil?: Date;
  privacyConsent: boolean;
  allowExternalFactCheck: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "analyst", "admin"], default: "user", index: true },
    emailVerified: { type: Boolean, default: false, index: true },
    phoneVerified: { type: Boolean, default: false, index: true },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    privacyConsent: { type: Boolean, default: true },
    allowExternalFactCheck: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
