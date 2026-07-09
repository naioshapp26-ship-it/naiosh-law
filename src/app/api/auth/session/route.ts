import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SessionConfigurationError,
  decodeSession,
  getSessionCookieOptions,
  sessionCookieName,
} from "@/lib/auth-session";

const authResponseHeaders = {
  "Cache-Control": "no-store, private",
  Vary: "Cookie",
};

export async function GET(request: Request) {
  const cookieStore = await cookies();
  let user;

  try {
    user = await decodeSession(cookieStore.get(sessionCookieName)?.value);
  } catch (error) {
    if (error instanceof SessionConfigurationError) {
      return NextResponse.json(
        { message: "Authentication is not configured." },
        { status: 503, headers: authResponseHeaders }
      );
    }

    throw error;
  }

  if (!user) {
    const response = NextResponse.json(
      { message: "No active session." },
      { status: 401, headers: authResponseHeaders }
    );
    response.cookies.set(sessionCookieName, "", {
      ...getSessionCookieOptions(request),
      expires: new Date(0),
      maxAge: 0,
    });

    return response;
  }

  return NextResponse.json({ user }, { headers: authResponseHeaders });
}
