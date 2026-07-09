import type { SessionUser } from "@/data/auth";
import { findDemoCredential, findDemoCredentialByRole } from "@/data/server-auth";
import { jsonError, jsonResponse, readJsonBody } from "@/lib/api-response";
import { getSessionCookieOptions } from "@/lib/session-cookie";
import { createSessionToken } from "@/lib/session-token";

type LoginBody = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  demo?: unknown;
};

function isRole(value: unknown): value is SessionUser["role"] {
  return value === "admin" || value === "client";
}

function demoLoginEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.NAIOSH_ENABLE_DEMO_LOGIN === "true";
}

export async function POST(request: Request) {
  const parsed = await readJsonBody<LoginBody>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const body = parsed.data;
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

  const response = jsonResponse({ user: sessionUser });
  response.cookies.set(getSessionCookieOptions(request, token));
  return response;
}
