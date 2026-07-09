import { NextResponse } from "next/server";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    ...sessionCookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
