export type Role = "admin" | "client";

export type SessionUser = {
  role: Role;
  name: string;
  email: string;
};

export const sessionCookieName = "naiosh-law-session";
export const sessionStorageKey = "naiosh-law-session";

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

export function getSafeAppPath(value: string | null | undefined, fallback = "/app/dashboard") {
  if (!value || !value.startsWith("/app") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://naiosh-law.local");
    if (parsed.origin !== "https://naiosh-law.local" || !parsed.pathname.startsWith("/app")) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
