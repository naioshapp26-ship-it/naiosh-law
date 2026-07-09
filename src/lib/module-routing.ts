import { modules, type LegalModule, type Role } from "@/data/modules";

const adminOnlySlugs = new Set(["administration", "integrations", "ai-center"]);

export const operationalModules = modules.filter((item) => item.slug !== "dashboard");

export function getModuleHref(slug: string) {
  return slug === "dashboard" ? "/app/dashboard" : `/app/modules/${slug}`;
}

export function canAccessModule(role: Role, slug: string) {
  if (!operationalModules.some((item) => item.slug === slug)) return false;
  return role === "admin" || !adminOnlySlugs.has(slug);
}

export function getVisibleOperationalModules(role: Role): LegalModule[] {
  return operationalModules.filter((item) => canAccessModule(role, item.slug));
}

