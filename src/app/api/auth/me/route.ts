import { NextResponse } from "next/server";
import { AUTH_COOKIE, getSessionFromCookies } from "@/lib/auth";
import { assertSessionNotRevoked } from "@/lib/auth-session-guard";

function clearAndUnauthorized(message: string, clearCookie: boolean) {
  const res = NextResponse.json({ error: message, code: clearCookie ? "SESSION_REVOKED" : "UNAUTHENTICATED" }, { status: 401 });
  if (clearCookie) {
    res.cookies.set(AUTH_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    // No cookie — do not clear anything or claim "session expired"
    return clearAndUnauthorized("غير مصرح", false);
  }
  const stillValid = await assertSessionNotRevoked(session);
  if (!stillValid) {
    return clearAndUnauthorized("انتهت صلاحية الجلسة — يرجى تسجيل الدخول مجددًا", true);
  }
  return NextResponse.json({
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
      id: session.sub,
    },
  });
}
