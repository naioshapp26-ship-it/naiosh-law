import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSession, getExpiredSessionCookieOptions, sessionCookieName } from "@/lib/auth-session";

export async function GET() {
  const cookieStore = await cookies();
  const user = await decodeSession(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    const response = NextResponse.json({ message: "No active session." }, { status: 401 });
    response.cookies.set(sessionCookieName, "", getExpiredSessionCookieOptions());

    return response;
  }

  return NextResponse.json({ user });
}
