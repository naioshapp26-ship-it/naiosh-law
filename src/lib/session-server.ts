import {
  isSessionUser,
  sessionCookieName,
  type SessionUser,
} from "@/lib/session-client";

type SessionPayload = SessionUser & {
  exp: number;
};

export { sessionCookieName };
export type { Role, SessionUser } from "@/lib/session-client";

export const sessionMaxAgeSeconds = 60 * 60 * 8;

const fallbackSessionSecret = "naiosh-law-demo-session-secret";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getSessionSecret() {
  const secret =
    process.env.NAIOSH_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;

  if (secret && secret.trim() !== "") {
    return secret;
  }

  return process.env.NODE_ENV === "production" ? null : fallbackSessionSecret;
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
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
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

export async function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds,
  };
  const body = encodeBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = await sign(body);

  if (!signature) {
    throw new Error("A session secret is required to create session tokens in production.");
  }

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
  if (!expectedSignature || !safeEqual(signature, expectedSignature)) {
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

