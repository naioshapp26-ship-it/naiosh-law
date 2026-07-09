import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSession, getSessionCookieOptions, sessionCookieName } from "@/lib/auth-session";

const noStoreHeaders = { "Cache-Control": "no-store" };

function jsonResponse(body: unknown, status?: number) {
  return NextResponse.json(body, { status, headers: noStoreHeaders });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const user = await decodeSession(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    const response = jsonResponse({ message: "No active session." }, 401);
    response.cookies.set(sessionCookieName, "", {
      ...getSessionCookieOptions(request),
      expires: new Date(0),
      maxAge: 0,
    });

    return response;
  }

  return jsonResponse({ user });
}
