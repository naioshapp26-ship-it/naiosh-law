import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE } from "@/lib/auth";

const DEV_JWT_SECRET = "naiosh-law-dev-secret-change-in-production";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NAIOSH_REQUIRE_SESSION_SECRET === "true") {
    return null;
  }
  return new TextEncoder().encode(secret ?? DEV_JWT_SECRET);
}

function loginUrl(request: NextRequest) {
  const url = new URL("/login", request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next !== "/login") {
    url.searchParams.set("next", next);
  }
  return url;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const secret = getJwtSecret();

  if (pathname === "/app/modules/dashboard") {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  if (pathname.startsWith("/app")) {
    if (!token || !secret) {
      const res = NextResponse.redirect(loginUrl(request));
      if (token) res.cookies.delete(AUTH_COOKIE);
      return res;
    }
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(loginUrl(request));
      res.cookies.delete(AUTH_COOKIE);
      return res;
    }
  }

  if (pathname === "/login" && token && secret) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    } catch {
      // invalid token — allow login page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
