export type Role = "admin" | "client";

export type SessionUser = {
  role: Role;
  name: string;
  email: string;
};

type SessionPayload = SessionUser & {
  exp: number;
};

export const sessionCookieName = "naiosh-law-session";
export const sessionStorageKey = "naiosh-law-session";
export const sessionMaxAgeSeconds = 60 * 60 * 8;

const fallbackSessionSecret = "naiosh-law-demo-session-secret";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getSessionSecret() {
  const configuredSecret =
    process.env.NAIOSH_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;

  if (configuredSecret) {
    return configuredSecret;
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.NAIOSH_ALLOW_DEMO_SESSION_SECRET !== "true"
  ) {
    throw new Error(
      "Missing session secret. Set NAIOSH_SESSION_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET in production."
    );
  }

  return fallbackSessionSecret;
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));

  return encodeBase64Url(new Uint8Array(signature));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

export function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SessionUser>;
  return (
    (candidate.role === "admin" || candidate.role === "client") &&
    typeof candidate.name === "string" &&
    candidate.name.trim() !== "" &&
    typeof candidate.email === "string" &&
    candidate.email.includes("@")
  );
}

export async function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds,
  };
  const body = encodeBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = await sign(body);

  return `${body}.${signature}`;
}

export async function readSessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) {
    return null;
  }

  const expectedSignature = await sign(body);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(textDecoder.decode(decodeBase64Url(body))) as Partial<SessionPayload>;
    const expiresAt = parsed.exp;
    if (!isSessionUser(parsed) || typeof expiresAt !== "number") {
      return null;
    }

    if (expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      role: parsed.role,
      name: parsed.name,
      email: parsed.email,
    };
  } catch {
    return null;
  }
}

export function getCookieValue(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const prefix = `${name}=`;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}

export function getSafeAppPath(value: string | null | undefined, fallback = "/app/dashboard") {
  if (!value || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://naiosh-law.local");
    const isAppPath = parsed.pathname === "/app" || parsed.pathname.startsWith("/app/");
    if (parsed.origin !== "https://naiosh-law.local" || !isAppPath) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
