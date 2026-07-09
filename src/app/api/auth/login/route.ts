import { NextRequest, NextResponse } from "next/server";
import { isRecord, readJsonBody } from "@/lib/api-request";
import { createSessionToken, getSessionCookieOptions, SessionConfigError, sessionCookieName } from "@/lib/session-token";
import { getDemoUserByCredentials, getDemoUserByRole } from "@/data/server-auth";
import type { SessionUser } from "@/lib/session-types";

type LoginBody = {
  email?: unknown;
  password?: unknown;
  demoRole?: unknown;
};

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const maxFailedAttempts = 8;
const rateLimitWindowMs = 60_000;

function isRole(value: unknown): value is SessionUser["role"] {
  return value === "admin" || value === "client";
}

function isDemoLoginEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.NAIOSH_ENABLE_DEMO_LOGIN === "true";
}

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(key: string) {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;

  if (Date.now() > attempt.resetAt) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.count >= maxFailedAttempts;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return;
  }

  loginAttempts.set(key, { ...attempt, count: attempt.count + 1 });
}

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: "too_many_attempts", message: "Too many failed login attempts. Please try again shortly." },
      { status: 429 }
    );
  }

  const body = await readJsonBody(request, { allowEmpty: false });
  if (!body.ok) return body.response;

  if (!isRecord(body.data)) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Login payload must be a JSON object." },
      { status: 400 }
    );
  }

  const payload = body.data as LoginBody;
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
  const password = typeof payload.password === "string" ? payload.password : null;
  const requestedDemoRole = isRole(payload.demoRole) ? payload.demoRole : null;

  if (requestedDemoRole && (email || password)) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Choose either demo role login or email/password login, not both." },
      { status: 400 }
    );
  }

  if (!isDemoLoginEnabled()) {
    return NextResponse.json(
      { error: "demo_login_disabled", message: "Demo login is disabled in this environment." },
      { status: 403 }
    );
  }

  const user = requestedDemoRole
    ? getDemoUserByRole(requestedDemoRole)
    : email && password
      ? getDemoUserByCredentials(email, password)
      : null;

  if (!user) {
    recordFailedAttempt(clientKey);
    return NextResponse.json(
      { error: "invalid_credentials", message: "Email or password is incorrect." },
      { status: 401 }
    );
  }

  try {
    const response = NextResponse.json({ user });
    loginAttempts.delete(clientKey);
    response.cookies.set(sessionCookieName, await createSessionToken(user), getSessionCookieOptions(request));
    return response;
  } catch (error) {
    if (error instanceof SessionConfigError) {
      return NextResponse.json(
        { error: "session_configuration_error", message: error.message },
        { status: 503 }
      );
    }
    throw error;
  }
}
