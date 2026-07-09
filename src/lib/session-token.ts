import type { SessionUser } from "@/lib/session";

export const sessionCookieName = "naiosh-law-session-token";

const tokenTtlSeconds = 60 * 60 * 8;
const demoSecret = "naiosh-law-local-demo-secret";

type SessionPayload = {
  user: SessionUser;
  exp: number;
};

export class SessionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionConfigError";
  }
}

function getSessionSecret() {
  const configured =
    process.env.NAIOSH_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (configured) return configured;

  // This repository is a demo app; keep production previews usable when no
  // platform secret has been provided. Real deployments should set one.
  return demoSecret;
}

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto) return forwardedProto === "https";

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeJson(value: unknown) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T {
  const bytes = base64UrlToBytes(value);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

async function signPayload(payload: string) {
  const secret = getSessionSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function getSessionCookieOptions(request?: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: request ? isSecureRequest(request) : process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tokenTtlSeconds,
  };
}

export function getExpiredSessionCookieOptions(request?: Request) {
  return {
    ...getSessionCookieOptions(request),
    maxAge: 0,
  };
}

export async function createSessionToken(user: SessionUser) {
  const payload = encodeJson({
    user,
    exp: Math.floor(Date.now() / 1000) + tokenTtlSeconds,
  } satisfies SessionPayload);
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function decodeSessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const [payload, signature] = parts;
  const expected = await signPayload(payload);
  if (!constantTimeEqual(signature, expected)) return null;

  try {
    const decoded = decodeJson<SessionPayload>(payload);
    if (!decoded.user || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded.user;
  } catch {
    return null;
  }
}
