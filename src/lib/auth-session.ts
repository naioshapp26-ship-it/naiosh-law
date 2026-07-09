import { NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";

export function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto === "https") {
    return true;
  }
  if (forwardedProto === "http") {
    return false;
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function sessionCookieOptions(request: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(request),
    path: "/",
  };
}

export function clearSessionCookie<T>(response: NextResponse<T>, request: Request) {
  response.cookies.set({
    name: sessionCookieName,
    value: "",
    ...sessionCookieOptions(request),
    expires: new Date(0),
    maxAge: 0,
  });
  return response;
}
