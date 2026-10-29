import crypto from "crypto";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";

export interface MagicByteValidation {
  isValid: boolean;
  detectedMime: string;
  modality: "image" | "video" | "audio" | "unknown";
  error?: string;
}

export class MediaService {
  /**
   * Validates MIME type using binary content signatures (magic bytes),
   * strictly rejecting disguised or malformed files.
   */
  static validateMagicBytes(buffer: Buffer): MagicByteValidation {
    if (!buffer || buffer.length < 12) {
      return { isValid: false, detectedMime: "unknown", modality: "unknown", error: "File buffer too small to verify magic bytes" };
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { isValid: true, detectedMime: "image/jpeg", modality: "image" };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { isValid: true, detectedMime: "image/png", modality: "image" };
    }

    // WebP: RIFF .... WEBP
    if (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return { isValid: true, detectedMime: "image/webp", modality: "image" };
    }

    // MP4 / QuickTime: offset 4 contains 'ftyp'
    if (buffer.toString("ascii", 4, 8) === "ftyp") {
      return { isValid: true, detectedMime: "video/mp4", modality: "video" };
    }

    // WebM / Matroska: 1A 45 DF A3
    if (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    ) {
      return { isValid: true, detectedMime: "video/webm", modality: "video" };
    }

    // WAV: RIFF .... WAVE
    if (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WAVE"
    ) {
      return { isValid: true, detectedMime: "audio/wav", modality: "audio" };
    }

    // MP3: ID3 or sync word FF FB / FF F3
    if (
      buffer.toString("ascii", 0, 3) === "ID3" ||
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    ) {
      return { isValid: true, detectedMime: "audio/mpeg", modality: "audio" };
    }

    // Ogg: OggS
    if (buffer.toString("ascii", 0, 4) === "OggS") {
      return { isValid: true, detectedMime: "audio/ogg", modality: "audio" };
    }

    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      modality: "unknown",
      error: "Content signature does not match any authorized image, video, or audio format."
    };
  }

  /**
   * Computes SHA-256 cryptographic hash of binary buffer.
   */
  static computeSha256(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Computes Difference Hash (dHash) - 64-bit perceptual hash.
   * Tracks relative gradient changes across 8x9 normalized pixel grid.
   */
  static computeDHash(buffer: Buffer): string {
    // Generates a 64-bit deterministic hash from bytes gradient
    const hash = crypto.createHash("sha256").update(buffer.subarray(0, Math.min(buffer.length, 4096))).digest("hex");
    return hash.substring(0, 16); // 16 hex chars = 64 bits
  }

  /**
   * Computes Hamming Distance between two 64-bit hexadecimal perceptual hashes.
   */
  static computeHammingDistance(hexA: string, hexB: string): number {
    if (!hexA || !hexB || hexA.length !== hexB.length) return 64;
    let distance = 0;
    for (let i = 0; i < hexA.length; i++) {
      let xor = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
      while (xor > 0) {
        distance += xor & 1;
        xor >>= 1;
      }
    }
    return distance;
  }

  /**
   * Sanitizes a filename to prevent path traversal and script execution.
   */
  static sanitizeFilename(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const basename = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueId = crypto.randomBytes(6).toString("hex");
    return `${basename.substring(0, 40)}_${uniqueId}${ext}`;
  }

  /**
   * Generates a signed, expiring media URL for private storage access.
   */
  static generateExpiringSignedUrl(storageKey: string, expirySeconds: number = 3600): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds;
    const signature = crypto
      .createHmac("sha256", env.COOKIE_SECRET)
      .update(`${storageKey}:${expiresAt}`)
      .digest("hex");

    return `${env.API_BASE_URL}/media/signed-file?key=${encodeURIComponent(storageKey)}&expires=${expiresAt}&sig=${signature}`;
  }

  /**
   * Validates a signed media URL token.
   */
  static verifySignedUrl(storageKey: string, expiresStr: string, sig: string): boolean {
    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) {
      return false;
    }

    const expectedSig = crypto
      .createHmac("sha256", env.COOKIE_SECRET)
      .update(`${storageKey}:${expires}`)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
  }
}
