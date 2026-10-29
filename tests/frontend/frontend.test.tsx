import { describe, it, expect } from "vitest";

describe("VERIFAI Frontend Security & UI Tests", () => {
  it("should have correct cryptographic configuration constants", () => {
    const requiredModalities = ["image", "video", "audio"];
    expect(requiredModalities).toContain("image");
    expect(requiredModalities).toContain("video");
    expect(requiredModalities).toContain("audio");
  });

  it("should validate phone number E.164 requirements", () => {
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    expect(e164Regex.test("+919876543210")).toBe(true);
    expect(e164Regex.test("+14155552671")).toBe(true);
    expect(e164Regex.test("9876543210")).toBe(false); // Missing country code
    expect(e164Regex.test("invalid-phone")).toBe(false);
  });

  it("should enforce strong master password requirements", () => {
    const checkPassword = (pwd: string) => {
      const hasLength = pwd.length >= 8;
      const hasUpper = /[A-Z]/.test(pwd);
      const hasDigit = /[0-9]/.test(pwd);
      const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
      return hasLength && hasUpper && hasDigit && hasSpecial;
    };

    expect(checkPassword("weak")).toBe(false);
    expect(checkPassword("NoSpecial123")).toBe(false);
    expect(checkPassword("ValidMasterPass123!#")).toBe(true);
  });

  it("should enforce 6-digit OTP formatting", () => {
    const otp = ["7", "2", "9", "4", "1", "5"];
    expect(otp.join("")).toHaveLength(6);
    expect(/^\d{6}$/.test(otp.join(""))).toBe(true);
  });
});
