import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  decodeSession,
  getSessionCookieOptions,
  isSessionConfigurationAvailable,
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

  return response;
}

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  const isLoginPage = request.nextUrl.pathname === "/login";
  if (!isLoginPage && !isSessionConfigurationAvailable()) {
    return new NextResponse("Session secret is not configured.", { status: 503 });
  }

  const user = await decodeSession(sessionToken);
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
    const response = NextResponse.next();
    return sessionToken ? clearSessionCookie(response, request) : response;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  const response = NextResponse.redirect(loginUrl);
  return sessionToken ? clearSessionCookie(response, request) : response;
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
