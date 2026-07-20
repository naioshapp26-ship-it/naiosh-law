import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE } from "@/lib/auth";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET?.trim() || "naiosh-law-dev-secret-change-in-production"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (pathname.startsWith("/app")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(AUTH_COOKIE);
      return res;
    }
  }

  // Always allow /login to render so users can switch accounts or re-authenticate.
  // (Previously a valid cookie redirected straight into /app and hid the login page.)
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
