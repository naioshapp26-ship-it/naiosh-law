import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { AUTH_COOKIE, signToken } from "@/lib/auth";
import { requireAuth } from "@/lib/api-helpers";
import { isDemoPortalSession } from "@/lib/client-portal";

/**
 * Ends other sessions by bumping passwordChangedAt, then re-issues a fresh cookie
 * for the current browser only.
 */
export async function POST() {
  const { error, session } = await requireAuth();
  if (error || !session) return error!;
  if (isDemoPortalSession(session)) {
    return NextResponse.json({ error: "غير متاح للحساب التجريبي" }, { status: 403 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  // Stamp slightly in the past so the re-issued JWT remains valid on this device
  const changedAt = new Date(Date.now() - 2000);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordChangedAt: changedAt },
  });

  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const response = NextResponse.json({
    ok: true,
    message: "تم إنهاء الجلسات الأخرى على الأجهزة السابقة",
  });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
