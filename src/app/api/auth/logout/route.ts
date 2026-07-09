import { NextResponse } from "next/server";
import { getExpiredSessionCookieOptions, sessionCookieName } from "@/lib/auth-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", getExpiredSessionCookieOptions());

  return response;
}
