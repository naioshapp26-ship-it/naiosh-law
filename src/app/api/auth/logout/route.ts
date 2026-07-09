import { NextResponse } from "next/server";
import { getSessionCookieOptions, sessionCookieName } from "@/lib/auth-session";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    ...getSessionCookieOptions(request),
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
