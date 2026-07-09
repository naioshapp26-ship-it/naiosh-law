/** Maps module slugs to REST API endpoints (Phase 0) */
export const moduleApiMap: Record<string, string> = {
  "case-management": "/api/cases",
  "clients-management": "/api/clients",
  "court-sessions": "/api/court-sessions",
  "administration": "/api/audit-logs",
};

export function getModuleApiEndpoint(slug: string) {
  return moduleApiMap[slug] ?? null;
}
