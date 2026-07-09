import { NextResponse } from "next/server";
import { getSessionCookieOptions, sessionCookieName } from "@/lib/auth-session";

const authResponseHeaders = {
  "Cache-Control": "no-store, private",
  Vary: "Cookie",
};

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true }, { headers: authResponseHeaders });
  response.cookies.set(sessionCookieName, "", {
    ...getSessionCookieOptions(request),
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
