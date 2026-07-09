import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SessionConfigurationError, decodeSession, sessionCookieName } from "@/lib/auth-session";
import { canAccessModule } from "@/lib/module-access";

function getModuleSlug(pathname: string) {
  const match = pathname.match(/^\/app\/modules\/([^/]+)/u);
  return match?.[1] ?? null;
}

export async function middleware(request: NextRequest) {
  let user;
  try {
    user = await decodeSession(request.cookies.get(sessionCookieName)?.value);
  } catch (error) {
    if (error instanceof SessionConfigurationError) {
      return NextResponse.json(
        { message: "Authentication is not configured." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
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
