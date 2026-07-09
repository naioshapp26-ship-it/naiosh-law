import { sessionCookieName } from "@/data/auth";
import { sessionMaxAgeSeconds } from "@/lib/session-token";

function forwardedProto(request: Request) {
  return request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
}

export function isSecureRequest(request?: Request) {
  if (!request) {
    return process.env.NODE_ENV === "production";
  }

  const proto = forwardedProto(request);
  if (proto) {
    return proto === "https";
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function getSessionCookieOptions(request: Request, value: string) {
  return {
    name: sessionCookieName,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(request),
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  };
}

export function getExpiredSessionCookieOptions(request: Request) {
  return {
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  };
}
