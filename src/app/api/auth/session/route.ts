import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { clearSessionCookie } from "@/lib/auth-session";
import { verifySessionToken } from "@/lib/session-token";

export async function GET(request: NextRequest) {
  const user = await verifySessionToken(request.cookies.get(sessionCookieName)?.value);

  if (!user) {
    const response = NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    if (request.cookies.has(sessionCookieName)) {
      clearSessionCookie(response, request);
    }
    return response;
  }

  return NextResponse.json({ user });
}
