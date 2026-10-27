import type { UserRole } from "@/generated/prisma/client";

export type PageSettingsScope = "global" | "office" | "role" | "user";

export type PageSettingsStatus = "operational" | "partial" | "planned";

export type PageSettingsCategory =
  | "cases"
  | "clients"
  | "lawyers"
  | "sessions"
  | "documents"
  | "finance"
  | "portal"
  | "admin"
  | "communications"
  | "reports"
  | "operations"
  | "knowledge"
  | "tasks"
  | "other";

export type SettingFieldType =
  | "boolean"
  | "string"
  | "number"
  | "select"
  | "multi-select"
  | "string-list"
  | "json";

export type SettingFieldDef = {
  key: string;
  label: string;
  description?: string;
  type: SettingFieldType;
  /** Nested path under values, e.g. display.pageSize */
  path: string;
  defaultValue: unknown;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  /** Cannot be turned off / emptied — legal/financial safety */
  locked?: boolean;
  rolesCanEdit?: UserRole[];
};

export type SettingTabId =
  | "display"
  | "fields"
  | "actions"
  | "permissions"
  | "workflow"
  | "reports"
  | "links"
  | "specialized"
  | "notifications"
  | "sections";

export type SettingTabDef = {
  id: SettingTabId;
  label: string;
  fields: SettingFieldDef[];
};

export type PageSettingsDefinition = {
  pageKey: string;
  title: string;
  description: string;
  category: PageSettingsCategory;
  /** Route of the live page this settings control */
  pageHref: string;
  /** Settings editor route */
  settingsHref: string;
  status: PageSettingsStatus;
  icon: string;
  /** Who may open the settings editor */
  manageRoles: UserRole[];
  tabs: SettingTabDef[];
  /** Why status is not operational (for reporting) */
  gapReason?: string;
};

export type ResolvedPageSettings = {
  pageKey: string;
  values: Record<string, unknown>;
  defaults: Record<string, unknown>;
  scopeApplied: PageSettingsScope;
  version: number | null;
  updatedAt: string | null;
  updatedById: string | null;
};

export const CATEGORY_LABELS: Record<PageSettingsCategory, string> = {
  cases: "القضايا",
  clients: "الموكلين والعملاء",
  lawyers: "المحامون والشبكة",
  sessions: "الجلسات والتقويم",
  documents: "المستندات والأرشيف",
  finance: "المالية القانونية",
  portal: "بوابة العميل",
  admin: "الإدارة والصلاحيات",
  communications: "الرسائل والإشعارات",
  reports: "التقارير",
  operations: "العمليات والفروع",
  knowledge: "المعرفة والتصنيف",
  tasks: "المهام",
  other: "أخرى",
};

export const STATUS_LABELS: Record<PageSettingsStatus, string> = {
  operational: "تشغيلية",
  partial: "جزئية",
  planned: "مخططة",
};
