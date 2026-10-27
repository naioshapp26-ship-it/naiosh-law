import { GENERIC_MODULE_KEYS } from "@/lib/page-settings/generic-modules";

/** Maps module slugs to REST API endpoints — client-safe (no Prisma). */
export const moduleApiMap: Record<string, string> = {
  "case-management": "/api/cases",
  "clients-management": "/api/clients",
  "court-sessions": "/api/court-sessions",
  "legal-accounting": "/api/financial-records",
  "notifications-center": "/api/notification-rules",
  "integrations": "/api/integrations",
};

for (const key of GENERIC_MODULE_KEYS) {
  moduleApiMap[key] = `/api/module-records/${key}`;
}

export function getModuleApiEndpoint(slug: string) {
  return moduleApiMap[slug] ?? null;
}
