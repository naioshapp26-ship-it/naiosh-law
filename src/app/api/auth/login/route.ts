import { NextResponse } from "next/server";
import { authenticateDemoUser, getDemoUserByRole } from "@/lib/demo-auth";
import { writeSessionCookie } from "@/lib/session-cookie";

type LoginPayload = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  demo?: unknown;
};

export async function POST(request: Request) {
  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const user =
    payload.demo === true && (payload.role === "admin" || payload.role === "client")
      ? getDemoUserByRole(payload.role)
      : typeof payload.email === "string" && typeof payload.password === "string"
        ? authenticateDemoUser(payload.email, payload.password)
        : null;

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password" },
      { status: 401 }
    );
  }

  await writeSessionCookie(user);

  return NextResponse.json({
    ok: true,
    user,
  });
}
