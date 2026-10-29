import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
  
  // Database
  MONGODB_URI: z.string().default("mongodb://localhost:27017/verifai_db"),
  
  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),
  
  // Secrets & Token Config
  JWT_ACCESS_SECRET: z.string().min(16).default("verifai-default-dev-jwt-access-secret-32-chars-min!"),
  JWT_REFRESH_SECRET: z.string().min(16).default("verifai-default-dev-jwt-refresh-secret-32-chars-min!"),
  COOKIE_SECRET: z.string().min(16).default("verifai-default-dev-cookie-secret-32-chars-min!"),
  CSRF_SECRET: z.string().min(16).default("verifai-default-dev-csrf-secret-32-chars-min!"),
  OTP_HASH_KEY: z.string().min(16).default("verifai-default-dev-otp-hmac-sha256-key-32-chars!"),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  MAX_OTP_ATTEMPTS: z.coerce.number().default(5),
  
  // Email Service (SMTP)
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("VERIFAI Security <security@verifai.io>"),
  EMAIL_PROVIDER_NAME: z.string().default("SMTP"),
  
  // Twilio / SMS Service
  TWILIO_ACCOUNT_SID: z.string().optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().optional().default(""),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional().default(""),
  SMS_SENDER_ID: z.string().default("VERIFAI"),
  
  // Storage (S3 / MinIO)
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_BUCKET_NAME: z.string().default("verifai-evidence-vault"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  STORAGE_SIGNED_URL_EXPIRY_SECONDS: z.coerce.number().default(3600),
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().default(104857600), // 100MB
  
  // Fact Check
  GOOGLE_FACTCHECK_API_KEY: z.string().optional().default("")
});

export const env = envSchema.parse(process.env);
