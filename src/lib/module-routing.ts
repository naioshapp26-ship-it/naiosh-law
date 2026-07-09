import { modules } from "@/data/modules";
import type { Role } from "@/data/modules";

export const moduleIcons: Record<string, string> = {
  dashboard: "⊞",
  "case-management": "⚖️",
  "clients-management": "👥",
  "court-sessions": "🏛️",
  "follow-up-center": "📋",
  "legal-accounting": "💰",
  "legal-services": "📝",
  "legal-consultations": "💬",
  "internal-requests": "📤",
  "complaints-management": "🔔",
  "smart-templates": "🤖",
  "reports-center": "📊",
  administration: "⚙️",
  "notifications-center": "🛎️",
  integrations: "🔗",
  "ai-center": "🧠",
  "general-tools": "🛠️",
};

export const operationalModules = modules.filter((item) => item.slug !== "dashboard");

const clientHiddenModules = new Set([
  "administration",
  "integrations",
  "ai-center",
  "notifications-center",
  "internal-requests",
  "legal-accounting",
]);

export function getVisibleOperationalModules(role: Role) {
  if (role === "admin") {
    return operationalModules;
  }

  return operationalModules.filter((item) => !clientHiddenModules.has(item.slug));
}

export function canAccessModule(role: Role, slug: string) {
  if (slug === "dashboard") {
    return true;
  }

  if (role === "admin") {
    return operationalModules.some((item) => item.slug === slug);
  }

  return getVisibleOperationalModules(role).some((item) => item.slug === slug);
}

export function getModuleHref(slug: string) {
  return slug === "dashboard" ? "/app/dashboard" : `/app/modules/${slug}`;
}
