import PDFDocument from "pdfkit";
import { IAnalysis } from "../models/Analysis.js";
import { IMediaAsset } from "../models/MediaAsset.js";
import { IReportVersion } from "../models/ReportVersion.js";

export class PdfReportService {
  /**
   * Generates a multi-page, audit-grade forensic PDF report.
   */
  static generateForensicPdf(params: {
    report: IReportVersion;
    analysis: IAnalysis;
    media: IMediaAsset;
    analystName?: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 40,
          info: {
            Title: `VERIFAI Forensic Report - ${params.report.reportNumber}`,
            Author: "VERIFAI Security Intelligence Engine",
            Subject: "Digital Media Authenticity & Deepfake Forensic Assessment",
            Keywords: "deepfake, forensics, verification, c2pa, authenticity"
          }
        });

        const buffers: Buffer[] = [];
        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", (err) => reject(err));

        const navyColor = "#0f172a";
        const cyanColor = "#0088cc";
        const darkGray = "#334155";
        const lightGray = "#64748b";

        // ================= HEADER =================
        doc.rect(40, 40, 515, 60).fill(navyColor);
        doc.fillColor("#00f0ff").fontSize(20).text("VERIFAI", 55, 52, { characterSpacing: 2 });
        doc.fillColor("#ffffff").fontSize(10).text("FORENSIC MEDIA VERIFICATION REPORT", 55, 78);
        doc.fillColor("#94a3b8").fontSize(8).text(`REPORT #: ${params.report.reportNumber}`, 360, 56);
        doc.text(`ISSUED: ${new Date(params.report.createdAt).toUTCString()}`, 360, 70);
        doc.text(`STATUS: ${params.report.status.toUpperCase()}`, 360, 84);

        doc.moveDown(4);

        // ================= SECTION 1: CHAIN OF CUSTODY & MEDIA ASSET =================
        doc.fillColor(navyColor).fontSize(13).text("1. EVIDENCE CHAIN OF CUSTODY & MEDIA METRICS", 40, 115);
        doc.rect(40, 130, 515, 1).fill("#cbd5e1");

        doc.fontSize(9).fillColor(darkGray);
        const yCustody = 140;
        doc.text(`Original Filename:`, 45, yCustody, { bold: true } as any);
        doc.fillColor(lightGray).text(`${params.media.originalFilename}`, 155, yCustody);

        doc.fillColor(darkGray).text(`MIME Content Type:`, 45, yCustody + 15);
        doc.fillColor(lightGray).text(`${params.media.mimeType} (${params.media.modality.toUpperCase()})`, 155, yCustody + 15);

        doc.fillColor(darkGray).text(`File Size:`, 45, yCustody + 30);
        doc.fillColor(lightGray).text(`${(params.media.sizeBytes / 1024).toFixed(1)} KB (${params.media.sizeBytes} bytes)`, 155, yCustody + 30);

        doc.fillColor(darkGray).text(`SHA-256 Hash:`, 45, yCustody + 45);
        doc.fillColor("#0284c7").font("Courier").fontSize(8).text(`${params.media.sha256Hash}`, 155, yCustody + 46);

        doc.font("Helvetica").fontSize(9).fillColor(darkGray).text(`Perceptual dHash:`, 45, yCustody + 60);
        doc.fillColor(lightGray).font("Courier").text(`${params.media.dHash || "N/A"}`, 155, yCustody + 60);

        doc.font("Helvetica").fontSize(9).fillColor(darkGray).text(`Tamper-Chained Hash:`, 45, yCustody + 75);
        doc.fillColor("#7928ca").font("Courier").fontSize(8).text(`${params.report.tamperChainHash}`, 155, yCustody + 76);

        // ================= SECTION 2: SYNTHESIS & RISK ASSESSMENT =================
        const yScore = 245;
        doc.font("Helvetica").fillColor(navyColor).fontSize(13).text("2. MULTIMODAL FORENSIC SYNTHESIS", 40, yScore);
        doc.rect(40, yScore + 15, 515, 1).fill("#cbd5e1");

        // Score Card Box
        const riskColor = 
          params.analysis.overallRisk === "critical" ? "#ef4444" :
          params.analysis.overallRisk === "high" ? "#f97316" :
          params.analysis.overallRisk === "medium" ? "#eab308" : "#22c55e";

        doc.rect(40, yScore + 25, 515, 65).fill("#f8fafc").stroke("#e2e8f0");
        doc.fillColor(riskColor).fontSize(28).text(`${(params.analysis.calibratedScore * 100).toFixed(1)}%`, 55, yScore + 38);
        doc.fillColor(darkGray).fontSize(10).text("CALIBRATED MANIPULATION PROBABILITY", 175, yScore + 38);
        doc.fontSize(8).fillColor(lightGray).text(
          `95% Confidence Interval: [${(params.analysis.confidenceInterval.lower * 100).toFixed(1)}% - ${(params.analysis.confidenceInterval.upper * 100).toFixed(1)}%] · Overall Risk Level: ${params.analysis.overallRisk.toUpperCase()}`,
          175,
          yScore + 54
        );
        doc.fontSize(8).fillColor(lightGray).text(
          `Duration: ${params.analysis.durationMs}ms · Evaluated Modalities: ${params.analysis.supportedModalities.join(", ")}`,
          175,
          yScore + 68
        );

        // Findings bullets
        doc.moveDown(2);
        doc.fillColor(navyColor).fontSize(10).text("Detected Forensic Signals & Inconsistencies:", 45, yScore + 102);
        let signalY = yScore + 118;
        for (const sig of params.analysis.detectedSignals) {
          doc.fillColor("#0284c7").text("•", 55, signalY);
          doc.fillColor(darkGray).fontSize(8.5).text(sig, 70, signalY, { width: 470 });
          signalY += 15;
        }

        // ================= SECTION 3: HUMAN REVIEW & NOTES =================
        const yReview = signalY + 20;
        doc.fillColor(navyColor).fontSize(13).text("3. ANALYST REVIEW & COLLABORATION STATUS", 40, yReview);
        doc.rect(40, yReview + 15, 515, 1).fill("#cbd5e1");

        doc.fontSize(9).fillColor(darkGray).text(`Assigned Analyst:`, 45, yReview + 25);
        doc.fillColor(lightGray).text(`${params.analystName || "Primary Verification Specialist"}`, 160, yReview + 25);

        doc.fillColor(darkGray).text(`Report Summary:`, 45, yReview + 40);
        doc.fillColor(lightGray).text(params.report.summary || "Forensic analysis completed with empirical neural & spectral evaluation.", 160, yReview + 40, { width: 380 });

        // ================= SECTION 4: LEGAL & TECHNICAL DISCLAIMER =================
        const yLegal = 680;
        doc.rect(40, yLegal, 515, 75).fill("#f1f5f9").stroke("#cbd5e1");
        doc.fillColor(navyColor).fontSize(8).text("IMPORTANT LEGAL & SCIENTIFIC DISCLAIMER", 50, yLegal + 10, { bold: true } as any);
        doc.fillColor(lightGray).fontSize(7.5).text(
          params.report.disclaimer ||
          "This report is generated using probabilistic AI models and algorithmic forensic heuristics. It does not constitute legally conclusive proof or court-certified testimony without independent forensic validation by an accredited expert.",
          50,
          yLegal + 24,
          { width: 495, lineGap: 2 }
        );
        doc.text(
          "VERIFAI adheres to the ISO/IEC 27037 standard for digital evidence handling and cryptographic chain of custody preservation.",
          50,
          yLegal + 55,
          { width: 495 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
