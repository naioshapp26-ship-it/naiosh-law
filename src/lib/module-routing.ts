import { modules } from "@/data/modules";
import type { Role } from "@/lib/session-client";

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

const adminOnlyModules = new Set(["administration", "integrations", "ai-center"]);

export function getModuleHref(slug: string) {
  return slug === "dashboard" ? "/app/dashboard" : `/app/modules/${slug}`;
}

export function canAccessModule(slug: string, role: Role) {
  if (slug === "dashboard" || role === "admin") {
    return true;
  }

  return !adminOnlyModules.has(slug);
}

export function getVisibleOperationalModules(role?: Role) {
  if (!role) {
    return operationalModules;
  }

  return operationalModules.filter((item) => canAccessModule(item.slug, role));
}
