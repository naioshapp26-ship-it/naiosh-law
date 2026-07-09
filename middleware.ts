import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeSession, sessionCookieName } from "@/lib/auth-session";

export async function middleware(request: NextRequest) {
  const user = await decodeSession(request.cookies.get(sessionCookieName)?.value);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (user && isLoginPage) {
    const redirectUrl = new URL("/app/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
