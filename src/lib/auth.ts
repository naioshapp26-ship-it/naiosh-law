import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { UserRole } from "@/generated/prisma/client";

export const AUTH_COOKIE = "naiosh-auth-token";

/** Must match on set and clear — browsers (esp. mobile) ignore deletes with mismatched attrs. */
export const AUTH_COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookie(response: NextResponse, token: string, maxAge = 60 * 60 * 24 * 7) {
  response.cookies.set(AUTH_COOKIE, token, {
    ...AUTH_COOKIE_BASE,
    maxAge,
  });
}

/** Explicit overwrite — do not use cookies.delete() alone (drops HttpOnly/SameSite). */
export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    ...AUTH_COOKIE_BASE,
    maxAge: 0,
    expires: new Date(0),
  });
}

export type AuthPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  /** JWT issued-at (seconds) — used to invalidate sessions after password change */
  iat?: number;
};

function getSecret() {
  const secret =
    process.env.JWT_SECRET?.trim() ||
    "naiosh-law-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: AuthPayload) {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role as UserRole,
      iat: typeof payload.iat === "number" ? payload.iat : undefined,
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function canWrite(role: UserRole) {
  return ["admin", "lawyer", "consultant", "industrial_agent", "employee"].includes(role);
}

export function canManageUsers(role: UserRole) {
  return role === "admin" || role === "industrial_agent";
}

export function isStaffRole(role: UserRole | string) {
  return canWrite(role as UserRole) || role === "judge";
}
