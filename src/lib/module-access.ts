import type { SessionRole } from "@/lib/auth-session";

const adminOnlyModuleSlugs = new Set(["administration", "integrations", "ai-center"]);

export function isAdminOnlyModule(slug: string) {
  return adminOnlyModuleSlugs.has(slug);
}

export function canAccessModule(role: SessionRole, slug: string) {
  return role === "admin" || !isAdminOnlyModule(slug);
}
