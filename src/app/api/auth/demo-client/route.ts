import { NextResponse } from "next/server";
import { AUTH_COOKIE, signToken } from "@/lib/auth";
import {
  DEMO_CLIENT_EMAIL,
  DEMO_CLIENT_USER_ID,
  PORTAL_HOME,
} from "@/lib/client-portal";
import { ensureDemoClientPortal } from "@/lib/ensure-demo-client";

/**
 * Server-side demo client login — password never sent from the browser.
 * Uses DB when available; falls back to signed demo JWT + fixture data.
 */
export async function POST() {
  try {
    const { user } = await ensureDemoClientPortal();
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "client",
    });
    const response = NextResponse.json({
      user: { email: user.email, name: user.name, role: "client" },
      redirect: PORTAL_HOME,
      demo: true,
    });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Offline / no-DB preview: issue fixture session
    if (
      message.includes("DATABASE_URL") ||
      message.includes("Invalid URL") ||
      message.includes("connect") ||
      message.includes("ECONNREFUSED") ||
      message.includes("password authentication") ||
      message.includes("DEMO_CLIENT_PASSWORD") ||
      message.includes("Can't reach database") ||
      message.includes("P1001") ||
      message.includes("P1017")
    ) {
      const token = await signToken({
        sub: DEMO_CLIENT_USER_ID,
        email: DEMO_CLIENT_EMAIL,
        name: "عميل تجريبي",
        role: "client",
      });
      const response = NextResponse.json({
        user: { email: DEMO_CLIENT_EMAIL, name: "عميل تجريبي", role: "client" },
        redirect: PORTAL_HOME,
        demo: true,
        offline: true,
      });
      response.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return response;
    }

    console.error("Demo client login error:", error);
    return NextResponse.json(
      { error: "تعذر فتح التجربة التجريبية", details: process.env.NODE_ENV === "production" ? undefined : message },
      { status: 500 }
    );
  }
}
