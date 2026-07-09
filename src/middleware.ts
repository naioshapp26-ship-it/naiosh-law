import { NextResponse, type NextRequest } from "next/server";
import { sessionKey } from "@/data/auth";

function hasValidDemoSession(value: string | undefined) {
  if (!value) return false;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Record<string, unknown>;
    return (
      (parsed.role === "admin" || parsed.role === "client") &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string"
    );
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const session = request.cookies.get(sessionKey)?.value;

  if (hasValidDemoSession(session)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(sessionKey);
  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
