import { NextResponse } from "next/server";
import { isSecureRequest, sessionCookieName } from "@/lib/session-shared";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });

  return response;
}
