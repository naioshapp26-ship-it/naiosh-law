import { createHash, randomBytes } from "crypto";

/** Shared password strength rules for register / change / reset. */
export function validatePasswordStrength(password: string): { ok: true } | { ok: false; error: string } {
  if (password.length < 8) {
    return { ok: false, error: "كلمة المرور يجب ألا تقل عن 8 أحرف" };
  }
  if (password.length > 128) {
    return { ok: false, error: "كلمة المرور طويلة جدًا" };
  }
  if (!/[A-Za-z\u0600-\u06FF]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, error: "كلمة المرور يجب أن تتضمن أحرفًا وأرقامًا" };
  }
  return { ok: true };
}

export function hashResetToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function createRawResetToken() {
  return randomBytes(32).toString("hex");
}

/** Uniform response — never reveal whether the email exists. */
export const FORGOT_PASSWORD_PUBLIC_MESSAGE =
  "إذا كان البريد مسجلاً لدينا، ستصلك تعليمات إعادة التعيين خلال دقائق.";
