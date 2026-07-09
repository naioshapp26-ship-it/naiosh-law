import { NextResponse } from "next/server";
import { encodeSession, getSessionCookieOptions, sessionCookieName, sessionMaxAgeSeconds } from "@/lib/auth-session";
import type { SessionRole } from "@/lib/auth-session";
import { findDemoUserByCredentials, findDemoUserByRole, toSessionUser } from "@/data/server-auth";

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
  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const demoUser =
    body.demo === true && isSessionRole(body.role)
      ? findDemoUserByRole(body.role)
      : typeof body.email === "string" && typeof body.password === "string"
        ? findDemoUserByCredentials(body.email.trim(), body.password)
        : undefined;

  if (!demoUser) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const user = toSessionUser(demoUser);
  const response = NextResponse.json({ user });
  const token = await encodeSession(user);

  response.cookies.set(sessionCookieName, token, {
    ...getSessionCookieOptions(request),
    maxAge: sessionMaxAgeSeconds,
  });

  return response;
}
