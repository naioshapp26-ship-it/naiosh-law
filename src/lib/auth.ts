import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@/generated/prisma/client";

export const AUTH_COOKIE = "naiosh-auth-token";

export type AuthPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
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
