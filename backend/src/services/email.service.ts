import crypto from "crypto";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { VerificationAttempt } from "../models/VerificationAttempt.js";

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (!EmailService.transporter) {
      if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        throw new Error(
          "SMTP email provider is not configured. Real email delivery requires valid SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables."
        );
      }

      EmailService.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
    }
    return EmailService.transporter;
  }

  /**
   * Hashes a 6-digit OTP using HMAC-SHA256 with server secret key.
   */
  static hashOtp(otp: string): string {
    return crypto.createHmac("sha256", env.OTP_HASH_KEY).update(otp).digest("hex");
  }

  /**
   * Generates and delivers a cryptographically secure 6-digit OTP to the verified recipient.
   */
  static async sendVerificationOtp(params: {
    email: string;
    ip: string;
    userAgent?: string;
    purpose?: "email_otp" | "password_reset";
  }): Promise<{ success: boolean; resendAfterSeconds: number }> {
    const email = params.email.toLowerCase().trim();
    const purpose = params.purpose || "email_otp";

    // Check resend cooldown
    const existing = await VerificationAttempt.findOne({
      target: email,
      type: purpose,
      verified: false
    }).sort({ createdAt: -1 });

    if (existing && existing.resendAfter > new Date()) {
      const waitSeconds = Math.ceil((existing.resendAfter.getTime() - Date.now()) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new verification code.`);
    }

    // Cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const codeHash = EmailService.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
    const resendAfter = new Date(Date.now() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000);

    // Save verification attempt with keyed hash only - NEVER store or log raw OTP
    await VerificationAttempt.create({
      target: email,
      type: purpose,
      codeHash,
      expiresAt,
      resendAfter,
      ip: params.ip,
      userAgent: params.userAgent,
      attempts: 0,
      maxAttempts: env.MAX_OTP_ATTEMPTS,
      verified: false
    });

    // Send real email via SMTP
    const transporter = EmailService.getTransporter();

    const subject = purpose === "password_reset" 
      ? "VERIFAI Security - Password Reset Verification Code" 
      : "VERIFAI Security - Verify Your Email Address";

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b1120; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e1b4b); padding: 32px 24px; text-align: center; border-bottom: 1px solid #334155;">
          <h1 style="margin: 0; color: #00f0ff; font-size: 24px; letter-spacing: 2px;">VERIFAI</h1>
          <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">AI-Powered Forensic Intelligence & Media Verification</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Verification Required</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Your one-time authentication code is provided below. This code will expire in <strong>${env.OTP_EXPIRY_MINUTES} minutes</strong>.
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; background: #0f172a; border: 2px solid #00f0ff; border-radius: 8px; padding: 14px 28px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #00f0ff;">
              ${rawOtp}
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
            Security Notice: If you did not initiate this verification request, your account credentials may be compromised. Never share this code with anyone. VERIFAI analysts will never ask for your one-time code.
          </p>
        </div>
        <div style="background-color: #070c17; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
          &copy; ${new Date().getFullYear()} VERIFAI Security Vault. All rights reserved.
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject,
        html: htmlBody
      });
      return { success: true, resendAfterSeconds: env.OTP_RESEND_COOLDOWN_SECONDS };
    } catch (sendErr: any) {
      throw new Error(`SMTP email delivery failed: ${sendErr.message}. Ensure valid SMTP provider credentials are configured.`);
    }
  }

  /**
   * Verifies the provided 6-digit OTP against the stored keyed HMAC hash.
   */
  static async verifyOtp(params: {
    email: string;
    otp: string;
    purpose?: "email_otp" | "password_reset";
  }): Promise<{ success: boolean; error?: string }> {
    const email = params.email.toLowerCase().trim();
    const purpose = params.purpose || "email_otp";

    const attempt = await VerificationAttempt.findOne({
      target: email,
      type: purpose,
      verified: false
    }).sort({ createdAt: -1 });

    if (!attempt) {
      return { success: false, error: "No active verification code found for this email. Please request a new code." };
    }

    if (attempt.expiresAt < new Date()) {
      return { success: false, error: "Verification code has expired. Please request a new code." };
    }

    if (attempt.attempts >= attempt.maxAttempts) {
      return { success: false, error: "Maximum verification attempts exceeded. Please request a new code." };
    }

    // Hash supplied OTP and compare in constant time
    const suppliedHash = EmailService.hashOtp(params.otp.trim());
    const match = crypto.timingSafeEqual(
      Buffer.from(suppliedHash, "hex"),
      Buffer.from(attempt.codeHash, "hex")
    );

    if (!match) {
      attempt.attempts += 1;
      await attempt.save();
      const remaining = attempt.maxAttempts - attempt.attempts;
      return {
        success: false,
        error: `Incorrect verification code. ${remaining} attempt(s) remaining.`
      };
    }

    attempt.verified = true;
    await attempt.save();

    return { success: true };
  }
}
