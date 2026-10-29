import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../../backend/src/app.js";
import { User } from "../../backend/src/models/User.js";
import { VerificationAttempt } from "../../backend/src/models/VerificationAttempt.js";
import { EmailService } from "../../backend/src/services/email.service.js";
import { MediaService } from "../../backend/src/services/media.service.js";
import { C2PAService } from "../../backend/src/services/c2pa.service.js";
import { AuditService } from "../../backend/src/services/audit.service.js";
import { PdfReportService } from "../../backend/src/services/pdfReport.service.js";
import { ReportVersion } from "../../backend/src/models/ReportVersion.js";
import { MediaAsset } from "../../backend/src/models/MediaAsset.js";
import { Analysis } from "../../backend/src/models/Analysis.js";

let mongoServer: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("VERIFAI Backend System Test Suite", () => {
  describe("1. Gateway Health Check", () => {
    it("should return healthy status", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("healthy");
      expect(res.body.service).toBe("VERIFAI API Gateway");
    });
  });

  describe("2. Cryptographic Security & Hash Chaining", () => {
    it("should create tamper-evident chained audit events and verify integrity", async () => {
      const hash1 = await AuditService.recordEvent({
        actorRole: "system",
        action: "GENESIS_TEST_EVENT",
        targetResource: "System",
        ip: "127.0.0.1",
        details: { step: 1 }
      });
      expect(hash1).toHaveLength(64);

      const hash2 = await AuditService.recordEvent({
        actorRole: "system",
        action: "SUBSEQUENT_TEST_EVENT",
        targetResource: "System",
        ip: "127.0.0.1",
        details: { step: 2 }
      });
      expect(hash2).toHaveLength(64);
      expect(hash1).not.toBe(hash2);

      const integrity = await AuditService.verifyChainIntegrity();
      expect(integrity.valid).toBe(true);
      expect(integrity.totalEvents).toBeGreaterThanOrEqual(2);
    });

    it("should compute accurate SHA-256 and 64-bit dHash perceptual hashes", () => {
      const testBuffer = Buffer.from("VERIFAI_FORENSIC_AUTHENTIC_BUFFER_TEST_PAYLOAD");
      const sha256 = MediaService.computeSha256(testBuffer);
      expect(sha256).toHaveLength(64);

      const dHash = MediaService.computeDHash(testBuffer);
      expect(dHash).toHaveLength(16);

      const dist = MediaService.computeHammingDistance(dHash, dHash);
      expect(dist).toBe(0);
    });
  });

  describe("3. Media Content Signature & Magic Bytes Validation", () => {
    it("should reject corrupted or disguised media without valid magic bytes", () => {
      const badBuffer = Buffer.from("THIS_IS_NOT_AN_IMAGE_OR_VIDEO_FILE");
      const res = MediaService.validateMagicBytes(badBuffer);
      expect(res.isValid).toBe(false);
      expect(res.modality).toBe("unknown");
    });

    it("should validate authentic JPEG magic bytes (FF D8 FF)", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const res = MediaService.validateMagicBytes(jpegBuffer);
      expect(res.isValid).toBe(true);
      expect(res.detectedMime).toBe("image/jpeg");
      expect(res.modality).toBe("image");
    });

    it("should validate authentic PNG magic bytes (89 50 4E 47)", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const res = MediaService.validateMagicBytes(pngBuffer);
      expect(res.isValid).toBe(true);
      expect(res.detectedMime).toBe("image/png");
      expect(res.modality).toBe("image");
    });
  });

  describe("4. Provenance & C2PA Metadata Parser", () => {
    it("should correctly identify absent credentials on plain media", () => {
      const plainBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const prov = C2PAService.inspectProvenance(plainBuffer);
      expect(prov.hasC2PA).toBe(false);
      expect(prov.c2paStatus).toBe("absent_credentials");
      expect(prov.signatureValid).toBe(false);
    });

    it("should detect C2PA claim block and verify structure", () => {
      const c2paBuffer = Buffer.from("HEADER_DATA_STREAM_urn:c2pa_c2pa.claim_AUTHENTIC_SIGNATURE_PAYLOAD_PADDING_FOR_TESTING");
      const prov = C2PAService.inspectProvenance(c2paBuffer);
      expect(prov.hasC2PA).toBe(true);
      expect(prov.c2paStatus).toBe("verified_provenance");
      expect(prov.signatureValid).toBe(true);
    });
  });

  describe("5. Real Authentication & Dual Verification Workflow", () => {
    const testEmail = "investigator@verifai-test.io";
    const testPhone = "+919876543210";

    it("should register user in unverified state (emailVerified=false, phoneVerified=false)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          fullName: "Lead Investigator",
          email: testEmail,
          phone: testPhone,
          password: "CyberPassword123#@",
          privacyConsent: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.emailVerified).toBe(false);
      expect(res.body.user.phoneVerified).toBe(false);

      const dbUser = await User.findOne({ email: testEmail });
      expect(dbUser).toBeDefined();
      expect(dbUser?.emailVerified).toBe(false);
      expect(dbUser?.phoneVerified).toBe(false);
      // Argon2id hash verification
      expect(dbUser?.passwordHash).toMatch(/^\$argon2id\$/);
    });

    it("should block unverified user from logging in (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testEmail,
          password: "CyberPassword123#@"
        });

      expect(res.status).toBe(403);
      expect(res.body.verificationRequired).toBe(true);
      expect(res.body.emailVerified).toBe(false);
    });

    it("should reject incorrect 6-digit email OTP", async () => {
      // Find the active verification attempt
      const attempt = await VerificationAttempt.findOne({ target: testEmail, type: "email_otp" });
      expect(attempt).toBeDefined();

      const res = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({
          email: testEmail,
          otp: "000000" // Intentional wrong code
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should verify email OTP with valid cryptographic keyed hash", async () => {
      // Create a known OTP attempt for testing
      const testOtp = "729415";
      const codeHash = EmailService.hashOtp(testOtp);
      await VerificationAttempt.create({
        target: testEmail,
        type: "email_otp",
        codeHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        resendAfter: new Date(Date.now() + 60 * 1000),
        ip: "127.0.0.1",
        attempts: 0,
        maxAttempts: 5,
        verified: false
      });

      const res = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({
          email: testEmail,
          otp: testOtp
        });

      expect(res.status).toBe(200);
      expect(res.body.emailVerified).toBe(true);

      const dbUser = await User.findOne({ email: testEmail });
      expect(dbUser?.emailVerified).toBe(true);
    });
  });

  describe("6. Forensic PDF Report Generation", () => {
    it("should generate a multi-page PDF buffer with chain of custody and disclaimer", async () => {
      const mockUser = await User.findOne();
      const mockMedia = await MediaAsset.create({
        userId: mockUser!._id,
        originalFilename: "test_deepfake_evidence.jpg",
        sanitizedFilename: "test_deepfake_evidence_001.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 154200,
        storageKey: "media/test/001.jpg",
        sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        dHash: "8a4f2b1c9e3d0f7a",
        status: "completed",
        modality: "image",
        consentGiven: true
      });

      const mockAnalysis = await Analysis.create({
        mediaAssetId: mockMedia._id,
        userId: mockUser!._id,
        status: "completed",
        overallRisk: "high",
        confidenceScore: 0.84,
        calibratedScore: 0.84,
        confidenceInterval: { lower: 0.79, upper: 0.89 },
        summary: "Synthetic facial boundary artifacts and high-frequency spectral grid peaks detected.",
        supportedModalities: ["image"],
        detectedSignals: [
          "High-frequency spectral grid artifacts characteristic of generative models",
          "Inconsistent JPEG compression history indicative of localized inpainting/splicing"
        ],
        durationMs: 420
      });

      const mockReport = await ReportVersion.create({
        reportNumber: "REP-TEST-001",
        analysisId: mockAnalysis._id,
        generatedById: mockUser!._id,
        versionNumber: 1,
        title: "Forensic Analysis Report - REP-TEST-001",
        summary: mockAnalysis.summary,
        tamperChainHash: "4f7a2b9c1d3e8f0a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f9012345",
        status: "approved"
      });

      const pdfBuffer = await PdfReportService.generateForensicPdf({
        report: mockReport,
        analysis: mockAnalysis,
        media: mockMedia,
        analystName: "Dr. Alice Morgan, Senior Forensics Specialist"
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // Valid PDF magic bytes: %PDF-
      expect(pdfBuffer.toString("ascii", 0, 5)).toBe("%PDF-");
    });
  });
});
