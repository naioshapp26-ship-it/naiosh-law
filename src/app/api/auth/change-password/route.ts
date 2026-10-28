import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { AUTH_COOKIE, signToken } from "@/lib/auth";
import { requireAuth } from "@/lib/api-helpers";
import { validatePasswordStrength } from "@/lib/password-policy";
import { isDemoPortalSession } from "@/lib/client-portal";

export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error!;

  if (isDemoPortalSession(session)) {
    return NextResponse.json({ error: "لا يمكن تغيير كلمة مرور الحساب التجريبي" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "تأكيد كلمة المرور غير متطابق" }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تختلف عن الحالية" }, { status: 400 });
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.ok) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user || !user.active) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    // Stamp slightly in the past so the fresh JWT (second-precision iat) stays valid
    const changedAt = new Date(Date.now() - 2000);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash, passwordChangedAt: changedAt },
    });

    // Invalidate prior reset tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Issue fresh session cookie for this browser; other sessions fail assertSessionNotRevoked
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const response = NextResponse.json({
      ok: true,
      message: "تم تغيير كلمة المرور بنجاح — تم إنهاء الجلسات الأخرى",
    });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (e) {
    console.error("change-password error");
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "تعذر تغيير كلمة المرور", details: process.env.NODE_ENV === "production" ? undefined : message },
      { status: 500 }
    );
  }
}
