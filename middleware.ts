import { NextResponse, type NextRequest } from "next/server";
import {
  getSafeAppPath,
  readSessionToken,
  sessionCookieName,
} from "@/lib/session-shared";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
