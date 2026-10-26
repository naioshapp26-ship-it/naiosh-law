import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import {
  FORGOT_PASSWORD_PUBLIC_MESSAGE,
  createRawResetToken,
  hashResetToken,
} from "@/lib/password-policy";

/**
 * Always returns the same public message (no email enumeration).
 * In non-production, may include `devResetToken` for isolated E2E only.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    const publicBody: Record<string, unknown> = {
      ok: true,
      message: FORGOT_PASSWORD_PUBLIC_MESSAGE,
    };

    if (!email || !email.includes("@")) {
      return NextResponse.json(publicBody);
    }

    try {
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.active && user.role === "client") {
        const raw = createRawResetToken();
        const tokenHash = hashResetToken(raw);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        });
        // Never log the raw token. Dev/preview E2E only:
        if (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_RESET_TOKEN === "1") {
          publicBody.devResetToken = raw;
          publicBody.devResetPath = `/reset-password?token=${raw}`;
        }
      }
    } catch {
      // Swallow DB errors — still return uniform message
    }

    return NextResponse.json(publicBody);
  } catch {
    return NextResponse.json({
      ok: true,
      message: FORGOT_PASSWORD_PUBLIC_MESSAGE,
    });
  }
}
