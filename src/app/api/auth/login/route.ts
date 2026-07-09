import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, AuthConfigurationError, signToken } from "@/lib/auth";
import { handleApiError, readJsonObject } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { body, error } = await readJsonObject(request);
    if (error) return error;

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "البريد وكلمة المرور مطلوبان" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
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
    if (error instanceof AuthConfigurationError) {
      return NextResponse.json({ error: "إعدادات المصادقة غير مكتملة" }, { status: 503 });
    }
    return handleApiError(error, "Login");
  }
}
