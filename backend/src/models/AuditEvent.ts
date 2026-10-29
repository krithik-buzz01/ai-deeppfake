import mongoose, { Schema, Document } from "mongoose";

export interface IAuditEvent extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  targetResource: string;
  targetId?: string;
  ip: string;
  userAgent?: string;
  previousHash: string;
  currentHash: string;
  details: Record<string, any>;
  timestamp: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetResource: { type: String, required: true, index: true },
    targetId: { type: String },
    ip: { type: String, required: true },
    userAgent: { type: String },
    previousHash: { type: String, required: true },
    currentHash: { type: String, required: true, unique: true, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

export const AuditEvent = mongoose.model<IAuditEvent>("AuditEvent", AuditEventSchema);
