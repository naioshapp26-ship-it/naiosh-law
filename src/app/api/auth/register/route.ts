import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { AUTH_COOKIE, signToken } from "@/lib/auth";
import { PORTAL_HOME } from "@/lib/client-portal";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const phone = String(body.phone ?? "").trim() || null;
    const { parseDialCodeOption } = await import("@/lib/person-contact");
    const phoneDialCode = body.phoneDialCode
      ? parseDialCodeOption(String(body.phoneDialCode))
      : null;
    const phoneSecondary = String(body.phoneSecondary ?? "").trim() || null;
    const phoneSecondaryDialCode = body.phoneSecondaryDialCode
      ? parseDialCodeOption(String(body.phoneSecondaryDialCode))
      : null;
    const country = String(body.country ?? "").trim() || null;
    const city = String(body.city ?? "").trim() || null;
    const type = String(body.type ?? "فرد").trim() || "فرد";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "الاسم والبريد وكلمة المرور مطلوبة" }, { status: 400 });
    }
    if (!phone || !phoneDialCode || !country || !city) {
      return NextResponse.json(
        { error: "مفتاح الدولة ورقم الجوال والدولة والمدينة مطلوبة" },
        { status: 400 }
      );
    }
    const { validatePasswordStrength } = await import("@/lib/password-policy");
    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم مسبقاً" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        role: "client",
        phone,
        active: true,
      },
    });

    const internalNo = `CL-${Date.now().toString().slice(-8)}`;
    await prisma.client.create({
      data: {
        userId: user.id,
        name,
        email,
        phone,
        phoneDialCode,
        phoneSecondary,
        phoneSecondaryDialCode,
        country,
        city,
        type,
        internalNo,
        preferredLanguage: "ar",
        profileComplete: Boolean(name && phone && country && city),
        isDemo: false,
        status: "نشط",
        notes: "حساب عميل جديد عبر بوابة التسجيل",
      },
    });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "client",
    });

    const response = NextResponse.json({
      user: { email: user.email, name: user.name, role: "client" },
      redirect: "/portal/profile?onboarding=1",
      home: PORTAL_HOME,
    });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Register error:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("DATABASE_URL")) {
      return NextResponse.json({ error: "قاعدة البيانات غير مضبوطة" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "تعذر إنشاء الحساب", details: process.env.NODE_ENV === "production" ? undefined : message },
      { status: 500 }
    );
  }
}
