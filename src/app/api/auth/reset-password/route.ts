import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { hashResetToken, validatePasswordStrength } from "@/lib/password-policy";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "").trim();
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "تأكيد كلمة المرور غير متطابق" }, { status: 400 });
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.ok) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    const prisma = getPrisma();
    const tokenHash = hashResetToken(token);
    const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "رابط إعادة التعيين غير صالح أو منتهٍ" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    // Keep stamp slightly behind JWT second-precision so the next login is accepted
    const changedAt = new Date(Date.now() - 2000);
    const usedAt = new Date();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { password: hash, passwordChangedAt: changedAt },
      }),
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: row.userId, usedAt: null, id: { not: row.id } },
        data: { usedAt },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "تم تعيين كلمة المرور الجديدة — يمكنك تسجيل الدخول الآن",
    });
  } catch (e) {
    console.error("reset-password error");
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "تعذر إعادة التعيين", details: process.env.NODE_ENV === "production" ? undefined : message },
      { status: 500 }
    );
  }
}
