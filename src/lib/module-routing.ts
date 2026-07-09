import { modules } from "@/data/modules";

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

export function getModuleHref(slug: string) {
  return slug === "dashboard" ? "/app/dashboard" : `/app/modules/${slug}`;
}
