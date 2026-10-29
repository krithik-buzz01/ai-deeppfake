import twilio from "twilio";
import { env } from "../config/env.js";
import { VerificationAttempt } from "../models/VerificationAttempt.js";

export class SmsService {
  private static twilioClient: twilio.Twilio | null = null;

  private static getClient(): twilio.Twilio {
    if (!SmsService.twilioClient) {
      if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) {
        throw new Error(
          "Twilio SMS verification is not configured. Real phone verification requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in environment variables."
        );
      }
      SmsService.twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }
    return SmsService.twilioClient;
  }

  /**
   * Dispatches a real SMS OTP via Twilio Verify to a validated E.164 phone number.
   */
  static async sendPhoneOtp(params: {
    phone: string;
    ip: string;
    userAgent?: string;
  }): Promise<{ success: boolean; resendAfterSeconds: number }> {
    const phone = params.phone.trim();

    // Verify E.164 format: + followed by 10-15 digits
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    if (!e164Regex.test(phone)) {
      throw new Error("Invalid phone number format. Mobile number must be in E.164 international format (e.g. +919876543210).");
    }

    // Cooldown check
    const existing = await VerificationAttempt.findOne({
      target: phone,
      type: "sms_otp",
      verified: false
    }).sort({ createdAt: -1 });

    if (existing && existing.resendAfter > new Date()) {
      const waitSeconds = Math.ceil((existing.resendAfter.getTime() - Date.now()) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new SMS verification code.`);
    }

    const client = SmsService.getClient();

    try {
      // Real Twilio Verify API dispatch
      const verification = await client.verify.v2
        .services(env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: phone,
          channel: "sms"
        });

      if (verification.status !== "pending") {
        throw new Error(`Twilio rejected SMS delivery with status '${verification.status}'.`);
      }

      const resendAfter = new Date(Date.now() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000);
      const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

      await VerificationAttempt.create({
        target: phone,
        type: "sms_otp",
        codeHash: `twilio:${verification.sid}`, // Track provider SID
        expiresAt,
        resendAfter,
        ip: params.ip,
        userAgent: params.userAgent,
        attempts: 0,
        maxAttempts: env.MAX_OTP_ATTEMPTS,
        verified: false
      });

      return { success: true, resendAfterSeconds: env.OTP_RESEND_COOLDOWN_SECONDS };
    } catch (err: any) {
      throw new Error(`SMS verification service error: ${err.message}. Ensure your mobile number is approved or your Twilio account is active.`);
    }
  }

  /**
   * Verifies the SMS OTP with Twilio Verify API.
   */
  static async verifyPhoneOtp(params: {
    phone: string;
    code: string;
  }): Promise<{ success: boolean; error?: string }> {
    const phone = params.phone.trim();
    const code = params.code.trim();

    const attempt = await VerificationAttempt.findOne({
      target: phone,
      type: "sms_otp",
      verified: false
    }).sort({ createdAt: -1 });

    if (!attempt) {
      return { success: false, error: "No active SMS verification session found for this phone number." };
    }

    if (attempt.expiresAt < new Date()) {
      return { success: false, error: "SMS verification code has expired. Please request a new code." };
    }

    if (attempt.attempts >= attempt.maxAttempts) {
      return { success: false, error: "Maximum verification attempts exceeded. Please request a new code." };
    }

    const client = SmsService.getClient();

    try {
      const check = await client.verify.v2
        .services(env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: phone,
          code
        });

      if (check.status === "approved") {
        attempt.verified = true;
        await attempt.save();
        return { success: true };
      } else {
        attempt.attempts += 1;
        await attempt.save();
        const remaining = attempt.maxAttempts - attempt.attempts;
        return {
          success: false,
          error: `Invalid SMS verification code. ${remaining} attempt(s) remaining.`
        };
      }
    } catch (err: any) {
      attempt.attempts += 1;
      await attempt.save();
      return {
        success: false,
        error: `Twilio verification check failed: ${err.message}`
      };
    }
  }
}
