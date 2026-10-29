import { User } from "../models/User.js";
import { AuthService } from "./auth.service.js";

export async function seedDefaultAccounts(): Promise<void> {
  const seedAccounts = [
    {
      fullName: "VERIFAI Lead Administrator",
      email: "admin@verifai.io",
      phone: "+15550000001",
      password: "Admin@123456",
      role: "admin" as const,
      emailVerified: true,
      phoneVerified: true,
      privacyConsent: true
    },
    {
      fullName: "Senior Forensic Analyst",
      email: "analyst@verifai.io",
      phone: "+15550000002",
      password: "Analyst@123456",
      role: "analyst" as const,
      emailVerified: true,
      phoneVerified: true,
      privacyConsent: true
    },
    {
      fullName: "Forensic Investigator",
      email: "user@verifai.io",
      phone: "+15550000003",
      password: "User@123456",
      role: "user" as const,
      emailVerified: true,
      phoneVerified: true,
      privacyConsent: true
    }
  ];

  for (const acc of seedAccounts) {
    const existing = await User.findOne({ email: acc.email });
    if (!existing) {
      const passwordHash = await AuthService.hashPassword(acc.password);
      await User.create({
        fullName: acc.fullName,
        email: acc.email,
        phone: acc.phone,
        passwordHash,
        role: acc.role,
        emailVerified: acc.emailVerified,
        phoneVerified: acc.phoneVerified,
        privacyConsent: acc.privacyConsent,
        failedLoginAttempts: 0
      });
      console.log(`[Seed] Created verified default ${acc.role} account: ${acc.email}`);
    } else {
      // Ensure existing default accounts are marked as verified so login succeeds
      if (!existing.emailVerified || !existing.phoneVerified) {
        existing.emailVerified = true;
        existing.phoneVerified = true;
        await existing.save();
        console.log(`[Seed] Updated ${acc.role} account verification status: ${acc.email}`);
      }
    }
  }
}
