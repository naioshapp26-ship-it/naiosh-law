import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE, clearAuthCookie } from "@/lib/auth";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET?.trim() || "naiosh-law-dev-secret-change-in-production"
);

async function readRole(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      role: typeof payload.role === "string" ? payload.role : null,
      ok: true as const,
    };
  } catch {
    return { role: null, ok: false as const };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const session = await readRole(token);

  // Client role cannot call staff/admin APIs — only auth + portal (+ public health/setup)
  if (pathname.startsWith("/api/")) {
    const clientAllowed =
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/portal") ||
      pathname.startsWith("/api/health") ||
      pathname.startsWith("/api/setup") ||
      pathname.startsWith("/api/creator-pages") ||
      // Resolved portal page-settings only (staff catalog remains blocked)
      pathname === "/api/page-settings/client-portal" ||
      pathname === "/api/public/homepage-settings";
    if (!clientAllowed && session?.ok && session.role === "client") {
      return NextResponse.json({ error: "صلاحية غير كافية — بوابة العميل فقط" }, { status: 403 });
    }
  }

  // Public homepage settings are intentionally readable without auth
  if (pathname === "/api/public/homepage-settings") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal")) {
    if (!token || !session?.ok) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      clearAuthCookie(res);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    if (session.role !== "client") {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  }

  if (pathname.startsWith("/app")) {
    if (!token || !session?.ok) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      clearAuthCookie(res);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    // Clients never enter staff/admin ERP surfaces
    if (session.role === "client") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  }

  // Always allow /login to render so users can switch accounts or re-authenticate.
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/portal/:path*", "/login", "/api/:path*"],
};
