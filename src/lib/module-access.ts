import type { SessionRole } from "@/lib/auth-session";

const adminOnlyModuleSlugs = new Set(["administration", "integrations", "ai-center"]);
const clientModuleSlugs = new Set([
  "case-management",
  "clients-management",
  "court-sessions",
  "follow-up-center",
  "legal-accounting",
  "legal-services",
  "legal-consultations",
  "complaints-management",
  "notifications-center",
]);

export function isAdminOnlyModule(slug: string) {
  return adminOnlyModuleSlugs.has(slug);
}

export function canAccessModule(role: SessionRole, slug: string) {
  return role === "admin" || clientModuleSlugs.has(slug);
}
