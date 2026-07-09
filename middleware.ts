import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/data/auth";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(sessionCookieName)?.value;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
