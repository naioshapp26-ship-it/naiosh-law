import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { AUTH_COOKIE, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "البريد وكلمة المرور مطلوبان" }, { status: 400 });
    }

    const user = await getPrisma().user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      user: { email: user.email, name: user.name, role: user.role },
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
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "قاعدة البيانات غير مضبوطة — أضف DATABASE_URL على Railway" },
        { status: 503 }
      );
    }

    if (
      message.includes("connect") ||
      message.includes("ECONNREFUSED") ||
      message.includes("SSL") ||
      message.includes("password authentication")
    ) {
      return NextResponse.json(
        { error: "تعذر الاتصال بقاعدة البيانات — تحقق من إعدادات Railway" },
        { status: 503 }
      );
    }

    if (message.includes("does not exist") || message.includes("P2021")) {
      return NextResponse.json(
        { error: "جداول قاعدة البيانات غير موجودة — شغّل npm run db:migrate" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "خطأ في الخادم", details: process.env.NODE_ENV === "production" ? undefined : message },
      { status: 500 }
    );
  }
}
