import { NextRequest, NextResponse } from "next/server";
import { canAccessModule } from "@/lib/module-routing";
import { decodeSessionToken, getSessionCookieOptions, SessionConfigError, sessionCookieName } from "@/lib/session-token";

const protectedPrefix = "/app";

function safeAppPath(pathname: string, search: string) {
  const path = `${pathname}${search}`;
  return path.startsWith("/app") && !path.startsWith("//") && !path.includes("://") ? path : "/app/dashboard";
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", safeAppPath(request.nextUrl.pathname, request.nextUrl.search));
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(sessionCookieName, "", { ...getSessionCookieOptions(request), maxAge: 0 });
  return response;
}

function decodeModuleSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(sessionCookieName)?.value;

  try {
    const user = await decodeSessionToken(sessionCookie);

    if (pathname === "/login") {
      if (!user) return NextResponse.next();
      const redirectTarget = request.nextUrl.searchParams.get("next");
      const url = new URL(
        redirectTarget?.startsWith("/app") && !redirectTarget.startsWith("//") && !redirectTarget.includes("://")
          ? redirectTarget
          : "/app/dashboard",
        request.url
      );
      return NextResponse.redirect(url);
    }

    if (!pathname.startsWith(protectedPrefix)) {
      return NextResponse.next();
    }

    if (!user) {
      return redirectToLogin(request);
    }

    if (pathname === "/app/modules/dashboard") {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }

    const moduleMatch = pathname.match(/^\/app\/modules\/([^/]+)$/);
    if (moduleMatch) {
      const slug = decodeModuleSlug(moduleMatch[1]);
      if (!slug || !/^[a-z0-9-]+$/.test(slug) || !canAccessModule(user.role, slug)) {
        return NextResponse.redirect(new URL("/app/dashboard", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    if (error instanceof SessionConfigError) {
      return NextResponse.json(
        { error: "session_configuration_error", message: error.message },
        { status: 503 }
      );
    }
    throw error;
  }
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
