import { moduleConfigs, type ModuleConfig } from "@/data/module-configs";
import { modules } from "@/data/modules";
import { getModuleApiEndpoint } from "@/lib/module-api";
import type { PageSettingsCategory, PageSettingsDefinition } from "./types";
import {
  actionsTab,
  displayTab,
  fieldsTab,
  permissionsTab,
  reportsTab,
  workflowTab,
} from "./defaults";
import {
  CASE_BEARING_MODULE_SLUGS,
  CASE_NO_KEY,
  CASE_PICKER_REQUIRED_SLUGS,
} from "@/lib/case-identity";

const STAFF_MANAGE = ["admin", "industrial_agent"] as const;

const CATEGORY_BY_SLUG: Record<string, PageSettingsCategory> = {
  "case-management": "cases",
  "clients-management": "clients",
  "court-sessions": "sessions",
  "follow-up-center": "operations",
  "legal-accounting": "finance",
  "legal-services": "operations",
  "legal-consultations": "clients",
  "internal-requests": "tasks",
  "complaints-management": "operations",
  "smart-templates": "documents",
  "reports-center": "reports",
  administration: "admin",
  "notifications-center": "communications",
  integrations: "operations",
  "ai-center": "operations",
  "general-tools": "tasks",
};

function columnOptions(config: ModuleConfig) {
  return config.columns.map((c) => ({ value: c.key, label: c.label }));
}

function fieldOptions(config: ModuleConfig) {
  return config.formFields.map((f) => ({ value: f.key, label: f.label }));
}

function defaultRequired(config: ModuleConfig) {
  return config.formFields.filter((f) => f.required).map((f) => f.key);
}

function guessStatuses(config: ModuleConfig): string[] {
  const statusField = config.formFields.find((f) => f.key === "status" && f.type === "select");
  if (statusField?.options?.length) return statusField.options;
  return ["نشط", "معلق", "مغلق"];
}

/**
 * Build a rich no-code settings definition from ModuleShell config.
 * API-backed modules are candidates for operational after E2E proof;
 * demo-only modules stay partial until a real API exists for record CF values.
 */
export function definitionFromModuleConfig(
  config: ModuleConfig,
  opts?: { forceOperational?: boolean }
): PageSettingsDefinition {
  const meta = modules.find((m) => m.slug === config.slug);
  const hasApi = Boolean(getModuleApiEndpoint(config.slug));
  const caseBearing = CASE_BEARING_MODULE_SLUGS.has(config.slug);
  const cols = columnOptions(config);
  const fields = fieldOptions(config);
  const required = defaultRequired(config);
  if (caseBearing && CASE_PICKER_REQUIRED_SLUGS.has(config.slug) && !required.includes(CASE_NO_KEY)) {
    required.unshift(CASE_NO_KEY);
  }
  const statuses = guessStatuses(config);
  const lockedVisible = caseBearing ? [CASE_NO_KEY] : [];
  const lockedRequired =
    caseBearing && CASE_PICKER_REQUIRED_SLUGS.has(config.slug) ? [CASE_NO_KEY] : [];

  // administration uses RolesPermissionsPage (title/subtitle wired via usePageSettings)
  const operational =
    opts?.forceOperational ?? (hasApi || config.slug === "administration");

  return {
    pageKey: config.slug,
    title: meta?.title ?? config.entityName,
    description: meta?.subtitle ?? `إعدادات وحدة ${config.entityName}`,
    category: CATEGORY_BY_SLUG[config.slug] ?? "other",
    pageHref: `/app/modules/${config.slug}`,
    settingsHref: `/app/page-settings/${config.slug}`,
    status: operational ? "operational" : "partial",
    icon: "📌",
    manageRoles: [...STAFF_MANAGE],
    gapReason: operational
      ? config.slug === "administration"
        ? "العنوان/الوصف من إعدادات الصفحة؛ محرر الأدوار مخصص ولا يستخدم جداول ModuleShell"
        : undefined
      : "محرك ModuleShell يطبّق العنوان/الأعمدة/الأقسام/الأزرار وتعريفات الحقول المخصصة؛ لا يوجد API مستقل لقيم السجلات — قيم الحقول المخصصة على البيانات التجريبية محلية حتى يُربط API",
    tabs: [
      displayTab({
        defaultTitle: meta?.title ?? config.entityName,
        defaultSubtitle: meta?.subtitle ?? "",
        columnOptions: cols,
        defaultVisibleColumns: cols.map((c) => c.value),
        lockedVisibleColumns: lockedVisible,
      }),
      fieldsTab({
        fieldOptions: fields.length ? fields : [{ value: "name", label: "الاسم" }],
        defaultRequired: required.length ? required : fields.slice(0, 1).map((f) => f.value),
        lockedRequired,
      }),
      actionsTab(),
      permissionsTab(),
      workflowTab(statuses, statuses[0] ?? "نشط"),
      reportsTab(),
    ],
  };
}

export function allModuleShellDefinitions(
  excludeKeys: Set<string>
): PageSettingsDefinition[] {
  return moduleConfigs
    .filter((c) => !excludeKeys.has(c.slug))
    .map((c) => definitionFromModuleConfig(c));
}
