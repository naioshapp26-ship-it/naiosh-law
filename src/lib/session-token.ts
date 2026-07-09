import type { SessionUser } from "@/data/auth";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const DAY_SECONDS = 24 * 60 * 60;

export const sessionMaxAgeSeconds = DAY_SECONDS;

type TokenPayload = SessionUser & {
  exp: number;
};

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error("Web Crypto is not available in this runtime.");
  }
  return cryptoApi;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeJson(value: unknown) {
  return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(decoder.decode(base64UrlToBytes(value))) as T;
  } catch {
    return null;
  }
}

function getSessionSecret() {
  const secret =
    process.env.NAIOSH_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production" && process.env.NAIOSH_ALLOW_DEMO_SESSION_SECRET !== "true") {
    throw new Error("Missing NAIOSH_SESSION_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET.");
  }

  return "local-naiosh-law-demo-session-secret";
}

async function getHmacKey(secret: string, usages: KeyUsage[]) {
  return getCrypto().subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

function isRole(value: unknown): value is SessionUser["role"] {
  return value === "admin" || value === "client";
}

function parsePayload(payload: TokenPayload | null): SessionUser | null {
  if (!payload || !isRole(payload.role) || typeof payload.name !== "string" || typeof payload.email !== "string") {
    return null;
  }
  if (!Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return {
    role: payload.role,
    name: payload.name,
    email: payload.email,
  };
}

export async function createSessionToken(user: SessionUser) {
  const payload: TokenPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds,
  };
  const encodedPayload = encodeJson(payload);
  const key = await getHmacKey(getSessionSecret(), ["sign"]);
  const signature = await getCrypto().subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  try {
    const key = await getHmacKey(getSessionSecret(), ["verify"]);
    const valid = await getCrypto().subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(parts[1]),
      encoder.encode(parts[0])
    );

    if (!valid) {
      return null;
    }

    return parsePayload(decodeJson<TokenPayload>(parts[0]));
  } catch {
    return null;
  }
}
