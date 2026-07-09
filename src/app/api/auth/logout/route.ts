import { NextRequest, NextResponse } from "next/server";
import { getExpiredSessionCookieOptions, sessionCookieName } from "@/lib/session-token";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", getExpiredSessionCookieOptions(request));
  return response;
}
