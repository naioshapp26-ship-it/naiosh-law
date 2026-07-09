import { NextResponse } from "next/server";
import { sessionCookieName, type SessionUser } from "@/data/auth";
import { findDemoCredential, findDemoCredentialByRole } from "@/data/server-auth";
import { parseJsonRequest } from "@/lib/api-request";
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

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const parsedBody = await parseJsonRequest<LoginBody>(request, { maxBytes: 8 * 1024 });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

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
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
  return response;
}
