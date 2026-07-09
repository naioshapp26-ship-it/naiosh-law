import { NextRequest, NextResponse } from "next/server";
import { decodeSessionToken, getExpiredSessionCookieOptions, sessionCookieName } from "@/lib/session-token";

export async function GET(request: NextRequest) {
  const user = await decodeSessionToken(request.cookies.get(sessionCookieName)?.value);
  if (!user) {
    const response = NextResponse.json(
      { error: "unauthorized", message: "A valid session is required." },
      { status: 401 }
    );
    response.cookies.set(sessionCookieName, "", getExpiredSessionCookieOptions(request));
    return response;
  }

  return NextResponse.json({ user });
}
