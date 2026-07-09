import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { canAccessModule } from "@/data/modules";
import { verifySessionToken } from "@/lib/session-token";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
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
    if (slug && !canAccessModule(user.role, slug)) {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
