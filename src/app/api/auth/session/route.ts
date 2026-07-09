import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { getExpiredSessionCookieOptions } from "@/lib/session-cookie";
import { verifySessionToken } from "@/lib/session-token";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  const user = await verifySessionToken(token);

  if (!user) {
    const response = NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    if (token) {
      response.cookies.set(getExpiredSessionCookieOptions(request));
    }
    return response;
  }

  return NextResponse.json({ user });
}
