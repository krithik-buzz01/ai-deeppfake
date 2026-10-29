import crypto from "crypto";
import mongoose from "mongoose";
import { AuditEvent } from "../models/AuditEvent.js";

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export class AuditService {
  /**
   * Appends an event to the tamper-evident hash-chained audit log.
   * Chaining equation:
   * currentHash = SHA-256(previousHash + timestamp + actorId + actorRole + action + targetResource + targetId + JSON(details))
   */
  static async recordEvent(params: {
    actorId?: mongoose.Types.ObjectId | string;
    actorRole: string;
    action: string;
    targetResource: string;
    targetId?: string;
    ip: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<string> {
    const lastEvent = await AuditEvent.findOne().sort({ timestamp: -1 });
    const previousHash = lastEvent ? lastEvent.currentHash : GENESIS_HASH;
    const timestamp = new Date();
    const details = params.details || {};

    const payload = `${previousHash}|${timestamp.toISOString()}|${params.actorId || "SYSTEM"}|${params.actorRole}|${params.action}|${params.targetResource}|${params.targetId || ""}|${JSON.stringify(details)}`;
    const currentHash = crypto.createHash("sha256").update(payload).digest("hex");

    await AuditEvent.create({
      actorId: params.actorId ? new mongoose.Types.ObjectId(params.actorId.toString()) : undefined,
      actorRole: params.actorRole,
      action: params.action,
      targetResource: params.targetResource,
      targetId: params.targetId,
      ip: params.ip,
      userAgent: params.userAgent,
      previousHash,
      currentHash,
      details,
      timestamp
    });

    return currentHash;
  }

  /**
   * Validates the integrity of the entire audit chain from genesis.
   */
  static async verifyChainIntegrity(): Promise<{ valid: boolean; totalEvents: number; brokenAt?: string }> {
    const events = await AuditEvent.find().sort({ timestamp: 1 });
    if (events.length === 0) {
      return { valid: true, totalEvents: 0 };
    }

    let expectedPrevHash = GENESIS_HASH;
    for (const evt of events) {
      if (evt.previousHash !== expectedPrevHash) {
        return { valid: false, totalEvents: events.length, brokenAt: evt.currentHash };
      }

      const payload = `${evt.previousHash}|${evt.timestamp.toISOString()}|${evt.actorId ? evt.actorId.toString() : "SYSTEM"}|${evt.actorRole}|${evt.action}|${evt.targetResource}|${evt.targetId || ""}|${JSON.stringify(evt.details)}`;
      const recomputedHash = crypto.createHash("sha256").update(payload).digest("hex");

      if (recomputedHash !== evt.currentHash) {
        return { valid: false, totalEvents: events.length, brokenAt: evt.currentHash };
      }

      expectedPrevHash = evt.currentHash;
    }

    return { valid: true, totalEvents: events.length };
  }
}
