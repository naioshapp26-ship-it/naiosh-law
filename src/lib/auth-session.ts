export type SessionRole = "admin" | "client";

export type SessionUser = {
  role: SessionRole;
  name: string;
  email: string;
};

type SessionPayload = SessionUser & {
  exp: number;
};

export const sessionCookieName = "naiosh-law-session-token";
export const sessionMaxAgeSeconds = 60 * 60 * 8;
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret() {
  return process.env.NAIOSH_SESSION_SECRET ?? "naiosh-law-demo-session-secret";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function createSignature(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return bytesToBase64Url(new Uint8Array(signature));
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SessionPayload>;

  return (
    (candidate.role === "admin" || candidate.role === "client") &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.exp === "number"
  );
}

export async function encodeSession(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + sessionMaxAgeSeconds * 1000,
  };
  const payloadPart = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signaturePart = await createSignature(payloadPart);

  return `${payloadPart}.${signaturePart}`;
}

export async function decodeSession(token?: string | null): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = await createSignature(payloadPart);

  if (signaturePart !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoder.decode(base64UrlToBytes(payloadPart))) as unknown;

    if (!isSessionPayload(parsed) || parsed.exp < Date.now()) {
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
