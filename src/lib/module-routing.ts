import { moduleMap, modules, type LegalModule, type Role } from "@/data/modules";

export const operationalModules = modules.filter((item) => item.slug !== "dashboard");

export function getModuleHref(slug: string) {
  return slug === "dashboard" ? "/app/dashboard" : `/app/modules/${slug}`;
}

export function canAccessModule(role: Role, slug: string) {
  const legalModule = moduleMap[slug];
  return Boolean(legalModule?.permissions[role]?.length);
}

export function getVisibleOperationalModules(role: Role): LegalModule[] {
  return operationalModules.filter((item) => canAccessModule(role, item.slug));
}

