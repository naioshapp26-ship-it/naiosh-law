import { NextResponse } from "next/server";
import { demoUsers, sessionCookieName, type DemoUser } from "@/data/auth";
import type { SessionUser } from "@/lib/session";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

const sessionMaxAge = 60 * 60 * 8;

function toSessionUser(user: DemoUser): SessionUser {
  return {
    role: user.role,
    name: user.name,
    email: user.email,
  };
}

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { ok: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const user = demoUsers.find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.password === body.password
  );

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const sessionUser = toSessionUser(user);
  const response = NextResponse.json({ ok: true, user: sessionUser });

  response.cookies.set({
    name: sessionCookieName,
    value: encodeURIComponent(JSON.stringify(sessionUser)),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAge,
  });

  return response;
}
