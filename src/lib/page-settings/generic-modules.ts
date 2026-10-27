/** Client-safe list of ModuleShell units backed by ModuleRecord store. */
export const GENERIC_MODULE_KEYS = [
  "follow-up-center",
  "legal-services",
  "legal-consultations",
  "internal-requests",
  "complaints-management",
  "smart-templates",
  "reports-center",
  "ai-center",
  "general-tools",
] as const;

export type GenericModuleKey = (typeof GENERIC_MODULE_KEYS)[number];

export function isGenericModuleKey(key: string): key is GenericModuleKey {
  return (GENERIC_MODULE_KEYS as readonly string[]).includes(key);
}
