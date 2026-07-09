import {
  decodeLegacySessionUser,
  isSessionUser,
  type SessionUser,
} from "@/lib/session-shared";

const tokenVersion = "v1";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const fallbackSessionSecret = "naiosh-law-demo-session-secret";

function getSessionSecret() {
  return (
    process.env.NAIOSH_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    fallbackSessionSecret
  );
}

function acceptsLegacySessionTokens() {
  return process.env.NAIOSH_ACCEPT_LEGACY_SESSION === "true";
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  return new Uint8Array(Buffer.from(padded, "base64"));
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(value: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function encodeSessionToken(user: SessionUser) {
  const payload = toBase64Url(encoder.encode(JSON.stringify(user)));
  const signedValue = `${tokenVersion}.${payload}`;
  const signature = await sign(signedValue);
  return `${signedValue}.${signature}`;
}

export async function decodeSessionToken(raw: string | undefined | null): Promise<SessionUser | null> {
  if (!raw) {
    return null;
  }

  const parts = raw.split(".");
  if (parts.length !== 3 || parts[0] !== tokenVersion) {
    return acceptsLegacySessionTokens() ? decodeLegacySessionUser(raw) : null;
  }

  const [version, payload, signature] = parts;
  const signedValue = `${version}.${payload}`;
  const expectedSignature = await sign(signedValue);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoder.decode(fromBase64Url(payload)));
    return isSessionUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
