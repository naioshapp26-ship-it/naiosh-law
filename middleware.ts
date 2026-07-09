import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SessionConfigurationError,
  decodeSession,
  getSessionCookieOptions,
  sessionCookieName,
} from "@/lib/auth-session";
import { canAccessModule } from "@/lib/module-access";

function getModuleSlug(pathname: string) {
  const match = pathname.match(/^\/app\/modules\/([^/]+)/u);
  return match?.[1] ?? null;
}

function clearSessionCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set(sessionCookieName, "", {
    ...getSessionCookieOptions(request),
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function middleware(request: NextRequest) {
  let user;
  try {
    user = await decodeSession(request.cookies.get(sessionCookieName)?.value);
  } catch (error) {
    if (error instanceof SessionConfigurationError) {
      const isLoginPage = request.nextUrl.pathname === "/login";
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
      const response = isLoginPage
        ? NextResponse.next()
        : NextResponse.redirect(loginUrl);

      clearSessionCookie(response, request);
      return response;
    }

    throw error;
  }
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isDashboardModule = request.nextUrl.pathname === "/app/modules/dashboard";
  const moduleSlug = getModuleSlug(request.nextUrl.pathname);

  if (user && isLoginPage) {
    const redirectUrl = new URL("/app/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isDashboardModule) {
    const redirectUrl = new URL("/app/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && moduleSlug && !canAccessModule(user.role, moduleSlug)) {
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
