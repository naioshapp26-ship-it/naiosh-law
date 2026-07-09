import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieOptions, sessionCookieName } from "@/lib/session-token";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", { ...getSessionCookieOptions(request), maxAge: 0 });
  return response;
}
