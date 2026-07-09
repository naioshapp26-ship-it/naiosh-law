import { NextResponse } from "next/server";
import { encodeSession, getSessionCookieOptions, sessionCookieName, sessionMaxAgeSeconds } from "@/lib/auth-session";
import type { SessionRole } from "@/lib/auth-session";
import { findDemoUserByCredentials, findDemoUserByRole, toSessionUser } from "@/data/server-auth";
import { readJsonBody } from "@/lib/api-request";

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
  const bodyResult = await readJsonBody<LoginRequest>(request, { maxBytes: 4096 });

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.data ?? {};
  const demoUser =
    body.demo === true && isSessionRole(body.role)
      ? findDemoUserByRole(body.role)
      : typeof body.email === "string" && typeof body.password === "string"
        ? findDemoUserByCredentials(body.email.trim().toLocaleLowerCase(), body.password)
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
