import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { canAccessModule, isKnownModuleSlug } from "@/data/modules";
import { verifySessionToken } from "@/lib/session-token";

const moduleNotFoundHtml = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>الصفحة غير موجودة</title>
  </head>
  <body style="margin:0;font-family:Arial,Tahoma,sans-serif;background:#f8f9fb;color:#0a0a12;min-height:100vh;display:grid;place-items:center;text-align:center;padding:1.5rem">
    <main style="width:min(100%,520px);background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:2rem;box-shadow:0 16px 40px rgba(0,0,0,.06)">
      <div style="font-size:3rem;margin-bottom:1rem">🔍</div>
      <h1 style="font-size:1.4rem;margin:0 0 .5rem;font-weight:900">الصفحة غير موجودة</h1>
      <p style="color:#64748b;margin:0 0 1.5rem">الرابط المطلوب غير متاح أو تم نقله.</p>
      <a href="/app/dashboard" style="display:inline-block;background:#c3152a;color:#fff;border-radius:12px;padding:.875rem 2rem;font-weight:700;text-decoration:none">العودة للوحة التحكم</a>
    </main>
  </body>
</html>`;

function moduleNotFoundResponse() {
  return new NextResponse(moduleNotFoundHtml, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await verifySessionToken(request.cookies.get(sessionCookieName)?.value);

  if (pathname === "/app/modules/dashboard") {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  if (pathname.startsWith("/app")) {
    if (!user) {
      return redirectToLogin(request);
    }

    const moduleMatch = pathname.match(/^\/app\/modules\/([^/]+)/);
    const slug = moduleMatch?.[1];
    if (slug && !isKnownModuleSlug(slug)) {
      return moduleNotFoundResponse();
    }
    if (slug && !canAccessModule(user.role, slug)) {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
