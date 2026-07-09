import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { adminOnlyModuleSlugs } from "@/data/modules";
import { verifySessionToken } from "@/lib/session-token";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

function safeAppPath(value: string | null) {
  return value === "/app" || value?.startsWith("/app/") ? value : "/app/dashboard";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await verifySessionToken(request.cookies.get(sessionCookieName)?.value);

  if (pathname === "/app/modules/dashboard") {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  if (pathname.startsWith("/app")) {
    if (!user) {
      return redirectToLogin(request);
    }

    const moduleMatch = pathname.match(/^\/app\/modules\/([^/]+)/);
    const slug = moduleMatch?.[1];
    if (slug && adminOnlyModuleSlugs.includes(slug) && user.role !== "admin") {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL(safeAppPath(request.nextUrl.searchParams.get("next")), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
