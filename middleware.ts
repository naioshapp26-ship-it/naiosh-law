import { NextRequest, NextResponse } from "next/server";
import { decodeSessionUser, sessionCookieName } from "@/lib/session-shared";

function getSafeAppPath(value: string | null) {
  if (!value || !value.startsWith("/app")) {
    return "/app/dashboard";
  }

  return value;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = decodeSessionUser(request.cookies.get(sessionCookieName)?.value);

  if (pathname === "/login" && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = getSafeAppPath(request.nextUrl.searchParams.get("next"));
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/app") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
