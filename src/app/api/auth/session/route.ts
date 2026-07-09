import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSession, getSessionCookieOptions, sessionCookieName } from "@/lib/auth-session";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const user = await decodeSession(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    const response = NextResponse.json({ message: "No active session." }, { status: 401 });
    response.cookies.set(sessionCookieName, "", {
      ...getSessionCookieOptions(request),
      expires: new Date(0),
      maxAge: 0,
    });

    return response;
  }

  return NextResponse.json({ user });
}
