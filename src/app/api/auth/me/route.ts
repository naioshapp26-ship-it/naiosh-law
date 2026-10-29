import { NextResponse } from "next/server";
import { clearAuthCookie, getSessionFromCookies } from "@/lib/auth";
import { assertSessionNotRevoked } from "@/lib/auth-session-guard";

function clearAndUnauthorized(message: string, shouldClearCookie: boolean) {
  const res = NextResponse.json({ error: message, code: shouldClearCookie ? "SESSION_REVOKED" : "UNAUTHENTICATED" }, { status: 401 });
  if (shouldClearCookie) {
    clearAuthCookie(res);
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
