import { Request, Response } from "express";
import { z } from "zod";
import { User, IUser } from "../models/User.js";
import { AuthService } from "../services/auth.service.js";
import { EmailService } from "../services/email.service.js";
import { SmsService } from "../services/sms.service.js";
import { AuditService } from "../services/audit.service.js";

// Validation Schemas
const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{9,14}$/, "Phone must be in E.164 format (+[country code][number], e.g. +919876543210)"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  privacyConsent: z.boolean().default(true)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "Verification code must be exactly 6 digits")
});

const verifyPhoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{9,14}$/),
  code: z.string().min(4).max(8)
});

export class AuthController {
  /**
   * User registration requiring dual email and phone ownership verification.
   */
  static async signup(req: Request, res: Response): Promise<void> {
    const parse = signupSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.issues[0].message });
      return;
    }

    const { fullName, email, phone, password, privacyConsent } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // Check uniqueness
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      res.status(409).json({ success: false, error: "An account with this email address already exists." });
      return;
    }

    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      res.status(409).json({ success: false, error: "An account with this mobile phone number already exists." });
      return;
    }

    // Hash password with Argon2id
    const passwordHash = await AuthService.hashPassword(password);

    // Create user in unverified state (role is always 'user' on public signup)
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      role: "user",
      emailVerified: false,
      phoneVerified: false,
      privacyConsent
    });

    const ip = req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"];

    // Audit creation
    await AuditService.recordEvent({
      actorId: user._id.toString(),
      actorRole: "user",
      action: "USER_SIGNUP_INITIATED",
      targetResource: "User",
      targetId: user._id.toString(),
      ip,
      userAgent
    });

    // Send real email OTP and SMS verification
    let emailDispatched = false;
    let smsDispatched = false;
    let emailError: string | undefined;
    let smsError: string | undefined;

    try {
      await EmailService.sendVerificationOtp({ email: normalizedEmail, ip, userAgent });
      emailDispatched = true;
    } catch (err: any) {
      emailError = err.message;
    }

    try {
      await SmsService.sendPhoneOtp({ phone: normalizedPhone, ip, userAgent });
      smsDispatched = true;
    } catch (err: any) {
      smsError = err.message;
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully. Verification codes have been dispatched to your email and mobile device.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      },
      deliveryStatus: {
        emailDispatched,
        smsDispatched,
        emailError,
        smsError
      }
    });
  }

  /**
   * Verify ownership of email address using 6-digit OTP.
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    const parse = verifyEmailSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.issues[0].message });
      return;
    }

    const { email, otp } = parse.data;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({ success: false, error: "User account not found." });
      return;
    }

    if (user.emailVerified) {
      res.status(200).json({ success: true, message: "Email is already verified.", emailVerified: true });
      return;
    }

    const result = await EmailService.verifyOtp({ email: user.email, otp });
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    user.emailVerified = true;
    await user.save();

    await AuditService.recordEvent({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "USER_EMAIL_VERIFIED",
      targetResource: "User",
      targetId: user._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"]
    });

    // Check if fully verified to issue session
    let sessionData = null;
    if (user.emailVerified && user.phoneVerified) {
      const session = await AuthService.createSession({
        user,
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });

      res.cookie("accessToken", session.accessToken, {
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000
      });

      res.cookie("refreshToken", session.refreshToken, {
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      sessionData = { accessToken: session.accessToken };
    }

    res.status(200).json({
      success: true,
      message: "Email address verified successfully.",
      emailVerified: true,
      phoneVerified: user.phoneVerified,
      fullyActivated: user.emailVerified && user.phoneVerified,
      session: sessionData
    });
  }

  /**
   * Verify ownership of phone number using SMS code.
   */
  static async verifyPhone(req: Request, res: Response): Promise<void> {
    const parse = verifyPhoneSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.issues[0].message });
      return;
    }

    const { phone, code } = parse.data;
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      res.status(404).json({ success: false, error: "User account not found." });
      return;
    }

    if (user.phoneVerified) {
      res.status(200).json({ success: true, message: "Phone is already verified.", phoneVerified: true });
      return;
    }

    const result = await SmsService.verifyPhoneOtp({ phone: user.phone, code });
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    user.phoneVerified = true;
    await user.save();

    await AuditService.recordEvent({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "USER_PHONE_VERIFIED",
      targetResource: "User",
      targetId: user._id.toString(),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"]
    });

    // Check if fully verified to issue session
    let sessionData = null;
    if (user.emailVerified && user.phoneVerified) {
      const session = await AuthService.createSession({
        user,
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });

      res.cookie("accessToken", session.accessToken, {
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000
      });

      res.cookie("refreshToken", session.refreshToken, {
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      sessionData = { accessToken: session.accessToken };
    }

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully.",
      emailVerified: user.emailVerified,
      phoneVerified: true,
      fullyActivated: user.emailVerified && user.phoneVerified,
      session: sessionData
    });
  }

  /**
   * Resend verification OTP for email.
   */
  static async resendEmailOtp(req: Request, res: Response): Promise<void> {
    const email = req.body.email?.toLowerCase()?.trim();
    if (!email) {
      res.status(400).json({ success: false, error: "Email address is required." });
      return;
    }

    try {
      const result = await EmailService.sendVerificationOtp({
        email,
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });
      res.status(200).json({ success: true, message: "Verification code sent to email.", resendAfterSeconds: result.resendAfterSeconds });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Resend verification SMS for phone number.
   */
  static async resendPhoneOtp(req: Request, res: Response): Promise<void> {
    const phone = req.body.phone?.trim();
    if (!phone) {
      res.status(400).json({ success: false, error: "Phone number is required." });
      return;
    }

    try {
      const result = await SmsService.sendPhoneOtp({
        phone,
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });
      res.status(200).json({ success: true, message: "Verification SMS dispatched to mobile device.", resendAfterSeconds: result.resendAfterSeconds });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * User login with Argon2id password verification and session cookie issue.
   */
  static async login(req: Request, res: Response): Promise<void> {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.issues[0].message });
      return;
    }

    const { email, password } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid email or password credentials." });
      return;
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMin = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      res.status(423).json({ success: false, error: `Account temporarily locked due to excessive failed attempts. Please retry in ${waitMin} minutes.` });
      return;
    }

    // Verify Argon2id password
    const valid = await AuthService.verifyPassword(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
      }
      await user.save();
      res.status(401).json({ success: false, error: "Invalid email or password credentials." });
      return;
    }

    // Reset failed attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Check dual verification status
    if (!user.emailVerified || !user.phoneVerified) {
      res.status(403).json({
        success: false,
        error: "Access denied. Both email and phone ownership must be verified before signing in.",
        verificationRequired: true,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      });
      return;
    }

    // Issue rotating refresh session
    const session = await AuthService.createSession({
      user,
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"]
    });

    res.cookie("accessToken", session.accessToken, {
      httpOnly: true,
      secure: req.secure || req.headers["x-forwarded-proto"] === "https",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", session.refreshToken, {
      httpOnly: true,
      secure: req.secure || req.headers["x-forwarded-proto"] === "https",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken: session.accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      }
    });
  }

  /**
   * User logout and session revocation.
   */
  static async logout(req: Request, res: Response): Promise<void> {
    if (req.sessionId) {
      await AuthService.revokeSession(req.sessionId, req.user?._id?.toString(), req.ip);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully." });
  }

  /**
   * Refresh session tokens with rotation.
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!rawRefreshToken) {
      res.status(401).json({ success: false, error: "No refresh token provided." });
      return;
    }

    try {
      const { accessToken, newRefreshToken } = await AuthService.rotateSession({
        rawRefreshToken,
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({ success: true, accessToken });
    } catch (err: any) {
      res.status(401).json({ success: false, error: err.message });
    }
  }

  /**
   * Current authenticated user profile.
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        emailVerified: req.user.emailVerified,
        phoneVerified: req.user.phoneVerified,
        mfaEnabled: req.user.mfaEnabled,
        privacyConsent: req.user.privacyConsent,
        allowExternalFactCheck: req.user.allowExternalFactCheck
      }
    });
  }
}
