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

const noStoreHeaders = { "Cache-Control": "no-store" };

function jsonResponse(body: unknown, status?: number) {
  return NextResponse.json(body, { status, headers: noStoreHeaders });
}

function acceptsJson(request: Request) {
  return request.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
}

function isSessionRole(role: unknown): role is SessionRole {
  return role === "admin" || role === "client";
}

export async function POST(request: Request) {
  let body: LoginRequest;

  if (!acceptsJson(request)) {
    return jsonResponse({ message: "Content-Type must be application/json." }, 415);
  }

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return jsonResponse({ message: "Invalid JSON payload." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const demoUser =
    body.demo === true && isSessionRole(body.role)
      ? findDemoUserByRole(body.role)
      : email && typeof body.password === "string"
        ? findDemoUserByCredentials(email, body.password)
        : undefined;

  if (!demoUser) {
    return jsonResponse({ message: "Invalid email or password." }, 401);
  }

  const user = toSessionUser(demoUser);
  const response = jsonResponse({ user });
  const token = await encodeSession(user);

  response.cookies.set(sessionCookieName, token, {
    ...getSessionCookieOptions(request),
    maxAge: sessionMaxAgeSeconds,
  });

  return response;
}
