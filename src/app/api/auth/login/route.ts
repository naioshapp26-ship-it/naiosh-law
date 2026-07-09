import { NextResponse } from "next/server";
import { authenticateDemoUser, getDemoUserByRole } from "@/lib/demo-auth";
import { writeSessionCookie } from "@/lib/session-cookie";
import { readJsonRequest } from "@/lib/api-request";

type LoginPayload = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  demo?: unknown;
};

export async function POST(request: Request) {
  const body = await readJsonRequest<LoginPayload>(request);
  if (!body.ok) {
    return body.response;
  }
  const payload = body.data;

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
