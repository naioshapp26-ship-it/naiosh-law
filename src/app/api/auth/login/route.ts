import { NextResponse } from "next/server";
import { demoUsers, toSessionUser } from "@/lib/demo-auth";
import { readJsonObject } from "@/lib/api-request";
import {
  createSessionToken,
  isDemoLoginEnabled,
  isSecureRequest,
  isSessionConfigError,
  sessionCookieName,
  sessionMaxAgeSeconds,
  type Role,
} from "@/lib/session-shared";

type LoginBody = {
  email?: unknown;
  password?: unknown;
  demoRole?: unknown;
};

export async function POST(request: Request) {
  const parsedBody = await readJsonObject(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const body = parsedBody.data as LoginBody;
  const demoRole = body.demoRole;
  const isDemoRole = demoRole === "admin" || demoRole === "client";

  if (isDemoRole && !isDemoLoginEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Demo login is disabled in this environment" },
      { status: 403 }
    );
  }

  if (!isDemoRole && (typeof body.email !== "string" || typeof body.password !== "string")) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const user = isDemoRole
    ? demoUsers.find((item) => item.role === (demoRole as Role))
    : demoUsers.find(
        (item) => item.email.toLowerCase() === normalizedEmail && item.password === password
      );

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const sessionUser = toSessionUser(user);
  let token: string;
  try {
    token = await createSessionToken(sessionUser);
  } catch (error) {
    if (isSessionConfigError(error)) {
      return NextResponse.json(
        { ok: false, error: "Session signing is not configured for this environment" },
        { status: 503 }
      );
    }
    throw error;
  }

  const response = NextResponse.json({ ok: true, user: sessionUser });

  response.cookies.set({
    name: sessionCookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });

  return response;
}
