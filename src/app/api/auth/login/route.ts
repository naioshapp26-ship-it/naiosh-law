import { NextResponse } from "next/server";
import { sessionCookieName, type SessionUser } from "@/data/auth";
import { findDemoCredential, findDemoCredentialByRole } from "@/data/server-auth";
import { parseJsonRequest } from "@/lib/api-request";
import { sessionCookieOptions } from "@/lib/auth-session";
import { createSessionToken, sessionMaxAgeSeconds } from "@/lib/session-token";

type LoginBody = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  demo?: unknown;
};

function isRole(value: unknown): value is SessionUser["role"] {
  return value === "admin" || value === "client";
}

function isLoginBody(value: unknown): value is LoginBody {
  return typeof value === "object" && value !== null;
}

function demoLoginEnabled() {
  return process.env.NODE_ENV !== "production";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const parsedBody = await parseJsonRequest<LoginBody>(request, { maxBytes: 8 * 1024 });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const body = isLoginBody(parsedBody.data) ? parsedBody.data : {};

  if (body.demo === true && !demoLoginEnabled()) {
    return jsonError("Demo login is disabled.", 403);
  }

  const user =
    body.demo === true && isRole(body.role)
      ? findDemoCredentialByRole(body.role)
      : typeof body.email === "string" && typeof body.password === "string"
        ? findDemoCredential(body.email, body.password)
        : undefined;

  if (!user) {
    return jsonError("Invalid credentials.", 401);
  }

  const sessionUser: SessionUser = {
    role: user.role,
    name: user.name,
    email: user.email,
  };

  let token: string;
  try {
    token = await createSessionToken(sessionUser);
  } catch {
    return jsonError("Session service is not configured.", 503);
  }

  const response = NextResponse.json({ user: sessionUser });
  response.cookies.set({
    name: sessionCookieName,
    value: token,
    ...sessionCookieOptions(request),
    maxAge: sessionMaxAgeSeconds,
  });
  return response;
}
