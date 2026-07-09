import { NextResponse, type NextRequest } from "next/server";
import { canAccessModule } from "@/lib/module-routing";
import { getSafeAppPath } from "@/lib/session-client";
import {
  readSessionToken,
  sessionCookieName,
} from "@/lib/session-server";

export async function middleware(request: NextRequest) {
  const session = await readSessionToken(request.cookies.get(sessionCookieName)?.value);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (isLoginPage) {
    if (session) {
      return NextResponse.redirect(
        new URL(getSafeAppPath(request.nextUrl.searchParams.get("next")), request.url)
      );
    }

    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const moduleMatch = request.nextUrl.pathname.match(/^\/app\/modules\/([^/]+)/);
  if (moduleMatch) {
    const slug = decodeURIComponent(moduleMatch[1]);
    if (!canAccessModule(slug, session.role)) {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
