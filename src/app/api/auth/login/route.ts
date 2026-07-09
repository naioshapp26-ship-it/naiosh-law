import { NextRequest, NextResponse } from "next/server";
import { isRecord, readJsonBody } from "@/lib/api-request";
import { createSessionToken, getSessionCookieOptions, SessionConfigError, sessionCookieName } from "@/lib/session-token";
import { getDemoUserByCredentials, getDemoUserByRole } from "@/data/server-auth";
import type { SessionUser } from "@/lib/session";

type LoginBody = {
  email?: unknown;
  password?: unknown;
  demoRole?: unknown;
};

function isRole(value: unknown): value is SessionUser["role"] {
  return value === "admin" || value === "client";
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request, { allowEmpty: false });
  if (!body.ok) return body.response;

  if (!isRecord(body.data)) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Login payload must be a JSON object." },
      { status: 400 }
    );
  }

  const payload = body.data as LoginBody;
  const user = isRole(payload.demoRole)
    ? getDemoUserByRole(payload.demoRole)
    : typeof payload.email === "string" && typeof payload.password === "string"
      ? getDemoUserByCredentials(payload.email, payload.password)
      : null;

  if (!user) {
    return NextResponse.json(
      { error: "invalid_credentials", message: "Email or password is incorrect." },
      { status: 401 }
    );
  }

  try {
    const response = NextResponse.json({ user });
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
