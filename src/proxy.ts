import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { adminOnlyModuleSlugs } from "@/data/modules";
import { AUTH_COOKIE, getJwtSecret, isUserRole } from "@/lib/auth";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

function safeAppPath(value: string | null) {
  return value === "/app" || value?.startsWith("/app/") ? value : "/app/dashboard";
}

async function getVerifiedPayload(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (pathname === "/app/modules/dashboard") {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  if (pathname.startsWith("/app")) {
    if (!token) {
      return redirectToLogin(request);
    }

    try {
      const payload = await getVerifiedPayload(token);
      const moduleMatch = pathname.match(/^\/app\/modules\/([^/]+)/);
      const slug = moduleMatch?.[1];
      if (
        slug &&
        adminOnlyModuleSlugs.includes(slug) &&
        (!isUserRole(payload.role) || (payload.role !== "admin" && payload.role !== "industrial_agent"))
      ) {
        return NextResponse.redirect(new URL("/app/dashboard", request.url));
      }
      return NextResponse.next();
    } catch {
      const response = redirectToLogin(request);
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }
  }

  if (pathname === "/login" && token) {
    try {
      await getVerifiedPayload(token);
      return NextResponse.redirect(new URL(safeAppPath(request.nextUrl.searchParams.get("next")), request.url));
    } catch {
      // Invalid token: allow the login page to render.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
