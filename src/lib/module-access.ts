import type { SessionRole } from "@/lib/auth-session";

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

const adminOnlyModuleSlugs = new Set([
  "internal-requests",
  "smart-templates",
  "reports-center",
  "administration",
  "integrations",
  "ai-center",
  "general-tools",
]);

export function isAdminOnlyModule(slug: string) {
  return adminOnlyModuleSlugs.has(slug);
}

export function canAccessModule(role: SessionRole, slug: string) {
  if (role === "admin") {
    return true;
  }

  return clientModuleSlugs.has(slug) && !isAdminOnlyModule(slug);
}
