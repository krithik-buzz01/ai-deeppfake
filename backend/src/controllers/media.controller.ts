import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { MediaAsset } from "../models/MediaAsset.js";
import { Fingerprint } from "../models/Fingerprint.js";
import { MediaService } from "../services/media.service.js";
import { AuditService } from "../services/audit.service.js";

// Ensure local vault storage directory exists
const VAULT_DIR = path.resolve("./vault");
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

export class MediaController {
  /**
   * Direct media upload with magic bytes inspection, SHA-256 and perceptual hashing.
   */
  static async uploadMedia(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No media file uploaded." });
      return;
    }

    const file = req.file;
    const validation = MediaService.validateMagicBytes(file.buffer);

    if (!validation.isValid || validation.modality === "unknown") {
      res.status(415).json({
        success: false,
        error: validation.error || "Unsupported media format. Content signature rejected."
      });
      return;
    }

    const sha256 = MediaService.computeSha256(file.buffer);
    const dHash = validation.modality === "image" || validation.modality === "video"
      ? MediaService.computeDHash(file.buffer)
      : undefined;

    const sanitizedFilename = MediaService.sanitizeFilename(file.originalname);
    const storageKey = `media/${req.user!._id}/${Date.now()}_${sanitizedFilename}`;
    const localFilePath = path.join(VAULT_DIR, sanitizedFilename);

    // Save to private vault
    fs.writeFileSync(localFilePath, file.buffer);

    const isLive = req.body.isLiveCapture === "true" || req.body.isLiveCapture === true;

    // Create MediaAsset record
    const asset = await MediaAsset.create({
      userId: req.user!._id,
      originalFilename: file.originalname,
      sanitizedFilename,
      mimeType: validation.detectedMime,
      sizeBytes: file.size,
      storageKey,
      sha256Hash: sha256,
      pHash: dHash,
      dHash,
      status: "uploaded",
      modality: validation.modality,
      isLiveCapture: isLive,
      consentGiven: true
    });

    // Save Fingerprint record
    if (dHash) {
      await Fingerprint.create({
        mediaAssetId: asset._id,
        userId: req.user!._id,
        sha256,
        pHash: dHash,
        dHash,
        filesize: file.size
      });
    }

    await AuditService.recordEvent({
      actorId: req.user!._id.toString(),
      actorRole: req.user!.role,
      action: "MEDIA_UPLOAD_VERIFIED",
      targetResource: "MediaAsset",
      targetId: asset._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      details: {
        sha256,
        mimeType: validation.detectedMime,
        sizeBytes: file.size,
        isLiveCapture: isLive
      }
    });

    // Generate expiring signed URL for user review
    const signedUrl = MediaService.generateExpiringSignedUrl(storageKey, 3600);

    res.status(201).json({
      success: true,
      message: "Media uploaded and cryptographic fingerprints generated successfully.",
      asset: {
        id: asset._id,
        filename: asset.originalFilename,
        mimeType: asset.mimeType,
        modality: asset.modality,
        sizeBytes: asset.sizeBytes,
        sha256Hash: asset.sha256Hash,
        dHash: asset.dHash,
        isLiveCapture: asset.isLiveCapture,
        signedUrl,
        createdAt: asset.createdAt
      }
    });
  }

  /**
   * Search for exact duplicates and near-duplicates across authorized media collection.
   */
  static async searchFingerprintDuplicates(req: Request, res: Response): Promise<void> {
    const assetId = req.params.assetId;
    const targetAsset = await MediaAsset.findById(assetId);

    if (!targetAsset) {
      res.status(404).json({ success: false, error: "Target asset not found." });
      return;
    }

    // Ownership or Analyst check
    if (targetAsset.userId.toString() !== req.user!._id.toString() && req.user!.role === "user") {
      res.status(403).json({ success: false, error: "Access denied. You may only investigate your authorized media." });
      return;
    }

    const allFingerprints = await Fingerprint.find({
      userId: req.user!._id,
      mediaAssetId: { $ne: targetAsset._id }
    }).populate("mediaAssetId");

    const exactMatches: any[] = [];
    const nearDuplicates: any[] = [];

    for (const fp of allFingerprints) {
      if (!fp.mediaAssetId) continue;
      const otherAsset = fp.mediaAssetId as unknown as any;

      // Exact cryptographic match
      if (fp.sha256 === targetAsset.sha256Hash) {
        exactMatches.push({
          assetId: otherAsset._id,
          filename: otherAsset.originalFilename,
          sha256: fp.sha256,
          similarityPercentage: 100,
          matchType: "exact_cryptographic",
          createdAt: otherAsset.createdAt
        });
        continue;
      }

      // Perceptual near-duplicate check via Hamming distance
      if (targetAsset.dHash && fp.dHash) {
        const dist = MediaService.computeHammingDistance(targetAsset.dHash, fp.dHash);
        if (dist <= 8) { // Up to 8 bits difference out of 64
          const similarity = Math.round(((64 - dist) / 64) * 100);
          nearDuplicates.push({
            assetId: otherAsset._id,
            filename: otherAsset.originalFilename,
            sha256: fp.sha256,
            hammingDistance: dist,
            similarityPercentage: similarity,
            matchType: "perceptual_near_duplicate",
            createdAt: otherAsset.createdAt
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      targetAsset: {
        id: targetAsset._id,
        filename: targetAsset.originalFilename,
        sha256: targetAsset.sha256Hash,
        dHash: targetAsset.dHash
      },
      exactMatches,
      nearDuplicates,
      totalDuplicatesFound: exactMatches.length + nearDuplicates.length
    });
  }

  /**
   * Serve private signed media file.
   */
  static async getSignedFile(req: Request, res: Response): Promise<void> {
    const { key, expires, sig } = req.query as { key: string; expires: string; sig: string };

    if (!key || !expires || !sig) {
      res.status(400).json({ success: false, error: "Missing signed URL parameters." });
      return;
    }

    const isValid = MediaService.verifySignedUrl(key, expires, sig);
    if (!isValid) {
      res.status(403).json({ success: false, error: "Signed URL is invalid or expired." });
      return;
    }

    const asset = await MediaAsset.findOne({ storageKey: key });
    if (!asset) {
      res.status(404).json({ success: false, error: "File not found." });
      return;
    }

    const filePath = path.join(VAULT_DIR, asset.sanitizedFilename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: "Physical file absent from vault." });
      return;
    }

    res.setHeader("Content-Type", asset.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${asset.originalFilename}"`);
    fs.createReadStream(filePath).pipe(res);
  }
}
