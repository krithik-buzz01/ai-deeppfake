import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authRateLimiter, otpRateLimiter } from "../middleware/rateLimiter.middleware.js";

const router = Router();

router.post("/signup", authRateLimiter, AuthController.signup);
router.post("/verify-email", otpRateLimiter, AuthController.verifyEmail);
router.post("/verify-phone", otpRateLimiter, AuthController.verifyPhone);
router.post("/resend-email-otp", otpRateLimiter, AuthController.resendEmailOtp);
router.post("/resend-phone-otp", otpRateLimiter, AuthController.resendPhoneOtp);
router.post("/login", authRateLimiter, AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/refresh", AuthController.refresh);
router.get("/me", requireAuth, AuthController.getMe);

export default router;
