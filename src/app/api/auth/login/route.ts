import { NextResponse } from "next/server";
import {
  encodeSession,
  getSessionCookieOptions,
  isSessionConfigurationError,
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

const noStoreResponse = {
  headers: {
    "Cache-Control": "private, no-store",
  },
};

function isSessionRole(role: unknown): role is SessionRole {
  return role === "admin" || role === "client";
}

function isDemoLoginEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.NAIOSH_ENABLE_DEMO_LOGIN === "true";
}

export async function POST(request: Request) {
  const parsedBody = await readJsonBody<LoginRequest>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  if (!isDemoLoginEnabled()) {
    return NextResponse.json(
      { message: "Demo login is disabled in this environment." },
      { status: 403, ...noStoreResponse }
    );
  }

  const body = parsedBody.data;
  const demoUser =
    body.demo === true && isSessionRole(body.role)
      ? findDemoUserByRole(body.role)
      : typeof body.email === "string" && typeof body.password === "string"
        ? findDemoUserByCredentials(body.email.trim().toLowerCase(), body.password)
        : undefined;

  if (!demoUser) {
    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: 401, ...noStoreResponse }
    );
  }

  const user = toSessionUser(demoUser);
  const response = NextResponse.json({ user }, noStoreResponse);
  let token: string;

  try {
    token = await encodeSession(user);
  } catch (error) {
    if (isSessionConfigurationError(error)) {
      return NextResponse.json(
        { message: "Session secret is not configured." },
        { status: 503, ...noStoreResponse }
      );
    }

    throw error;
  }

  response.cookies.set(sessionCookieName, token, {
    ...getSessionCookieOptions(request),
    maxAge: sessionMaxAgeSeconds,
  });

  return response;
}
