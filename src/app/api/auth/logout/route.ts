import { NextResponse } from "next/server";
import { getSessionCookieOptions, sessionCookieName } from "@/lib/session-token";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", { ...getSessionCookieOptions(), maxAge: 0 });
  return response;
}
