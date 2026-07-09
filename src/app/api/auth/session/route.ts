import { NextRequest, NextResponse } from "next/server";
import { decodeSessionToken, getExpiredSessionCookieOptions, SessionConfigError, sessionCookieName } from "@/lib/session-token";

export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    if (error instanceof SessionConfigError) {
      return NextResponse.json(
        { error: "session_configuration_error", message: error.message },
        { status: 503 }
      );
    }
    throw error;
  }
}
