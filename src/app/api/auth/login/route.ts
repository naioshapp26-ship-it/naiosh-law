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
import { readJsonRequest } from "@/lib/api-request";

type LoginRequest = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  demo?: unknown;
};

function isSessionRole(role: unknown): role is SessionRole {
  return role === "admin" || role === "client";
}

export async function POST(request: Request) {
  const body = await readJsonRequest<LoginRequest>(request, { limitBytes: 16 * 1024 });
  if (body instanceof NextResponse) {
    return body;
  }
  if (!body) {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const demoUser =
    body.demo === true && isSessionRole(body.role)
      ? findDemoUserByRole(body.role)
      : typeof body.email === "string" && typeof body.password === "string"
        ? findDemoUserByCredentials(body.email.trim().toLowerCase(), body.password)
        : undefined;

  if (!demoUser) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const user = toSessionUser(demoUser);
  const response = NextResponse.json({ user });
  let token: string;

  try {
    token = await encodeSession(user);
  } catch (error) {
    if (isSessionConfigurationError(error)) {
      return NextResponse.json({ message: "Session service is not configured." }, { status: 503 });
    }
    throw error;
  }

  response.cookies.set(sessionCookieName, token, {
    ...getSessionCookieOptions(request),
    maxAge: sessionMaxAgeSeconds,
  });

  return response;
}
