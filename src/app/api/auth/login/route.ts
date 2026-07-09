import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, signToken } from "@/lib/auth";
import { jsonError, jsonResponse, readJsonBody } from "@/lib/api-helpers";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export async function POST(request: Request) {
  const parsed = await readJsonBody<LoginBody>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const body = parsed.data;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return jsonError("البريد وكلمة المرور مطلوبان", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return jsonError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return jsonError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
    }

    let token: string;
    try {
      token = await signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch {
      return jsonError("Session service is not configured.", 503);
    }

    const response = jsonResponse({
      user: { email: user.email, name: user.name, role: user.role },
    });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: isSecureRequest(request),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("خطأ في الخادم", 500);
  }
}
