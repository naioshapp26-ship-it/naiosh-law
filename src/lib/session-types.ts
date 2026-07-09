export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

const roles = new Set<SessionUser["role"]>(["admin", "client"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeSessionUser(value: unknown): SessionUser | null {
  if (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    roles.has(value.role as SessionUser["role"])
  ) {
    return {
      role: value.role as SessionUser["role"],
      name: value.name,
      email: value.email,
    };
  }

  return null;
}

export function parseSessionUser(raw: string | null): SessionUser | null {
  if (!raw) return null;

  try {
    return normalizeSessionUser(JSON.parse(raw));
  } catch {
    // Invalid demo-session data should fail closed instead of crashing render.
    return null;
  }
}
