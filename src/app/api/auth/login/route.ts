import { NextResponse } from "next/server";
import {
  SessionConfigurationError,
  encodeSession,
  getSessionCookieOptions,
  sessionCookieName,
  sessionMaxAgeSeconds,
} from "@/lib/auth-session";
import type { SessionRole } from "@/lib/auth-session";
import { findDemoUserByCredentials, findDemoUserByRole, toSessionUser } from "@/data/server-auth";
import { readJsonBody } from "@/lib/api-request";

type LoginRequest = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  demo?: unknown;
};

const authResponseHeaders = {
  "Cache-Control": "no-store, private",
  Vary: "Cookie",
};

function isSessionRole(role: unknown): role is SessionRole {
  return role === "admin" || role === "client";
}

function isDemoLoginEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.NAIOSH_ENABLE_DEMO_LOGIN === "true";
}

export async function POST(request: Request) {
  const parsedBody = await readJsonBody<LoginRequest>(request, { limitBytes: 16 * 1024 });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const body = parsedBody.data;

  if (!isDemoLoginEnabled()) {
    return NextResponse.json(
      { message: "Demo login is not enabled." },
      { status: 503, headers: authResponseHeaders }
    );
  }

  const demoUser =
    body.demo === true && isSessionRole(body.role)
      ? findDemoUserByRole(body.role)
      : typeof body.email === "string" && typeof body.password === "string"
        ? findDemoUserByCredentials(body.email.trim().toLowerCase(), body.password)
        : undefined;

  if (!demoUser) {
    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: 401, headers: authResponseHeaders }
    );
  }

  const user = toSessionUser(demoUser);
  let token: string;

  try {
    token = await encodeSession(user);
  } catch (error) {
    if (error instanceof SessionConfigurationError) {
      return NextResponse.json(
        { message: "Authentication is not configured." },
        { status: 503, headers: authResponseHeaders }
      );
    }

    throw error;
  }

  const response = NextResponse.json({ user }, { headers: authResponseHeaders });

  response.cookies.set(sessionCookieName, token, {
    ...getSessionCookieOptions(request),
    maxAge: sessionMaxAgeSeconds,
  });

  return response;
}
