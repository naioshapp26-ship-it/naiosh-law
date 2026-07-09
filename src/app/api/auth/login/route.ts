import { NextResponse } from "next/server";
import { demoUsers, toSessionUser } from "@/lib/demo-auth";
import { readJsonObject } from "@/lib/api-request";
import {
  createSessionToken,
  sessionCookieName,
  sessionMaxAgeSeconds,
  type Role,
} from "@/lib/session-server";

type LoginBody = {
  email?: unknown;
  password?: unknown;
  demoRole?: unknown;
};

export async function POST(request: Request) {
  const parsedBody = await readJsonObject(request);
  if (parsedBody.error) {
    return parsedBody.error;
  }
  const body = parsedBody.data as LoginBody;

  const demoRole = body.demoRole;
  const isDemoRole = demoRole === "admin" || demoRole === "client";

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
  } catch {
    return NextResponse.json(
      { ok: false, error: "Session configuration is missing" },
      { status: 500 }
    );
  }
  const response = NextResponse.json({ ok: true, user: sessionUser });

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
