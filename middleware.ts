import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeSession, sessionCookieName } from "@/lib/auth-session";

export async function middleware(request: NextRequest) {
  const user = await decodeSession(request.cookies.get(sessionCookieName)?.value);

  if (user) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app/:path*"],
};
