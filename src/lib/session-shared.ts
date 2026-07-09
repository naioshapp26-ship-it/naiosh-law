export type SessionRole = "admin" | "client";

export type SessionUser = {
  role: SessionRole;
  name: string;
  email: string;
};

export const sessionStorageKey = "naiosh-law-session";
export const sessionCookieName = "naiosh-law-session";

export function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SessionUser>;
  return (
    (candidate.role === "admin" || candidate.role === "client") &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.email === "string" &&
    candidate.email.includes("@")
  );
}

export function decodeLegacySessionUser(raw: string | undefined | null): SessionUser | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return isSessionUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
