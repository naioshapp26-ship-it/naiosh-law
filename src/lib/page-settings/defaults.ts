import type { SettingFieldDef, SettingTabDef } from "./types";

export function field(
  partial: Omit<SettingFieldDef, "path"> & { path?: string }
): SettingFieldDef {
  return {
    path: partial.path ?? partial.key,
    ...partial,
  };
}

/** Shared display tab skeleton — customize options per page */
export function displayTab(opts: {
  defaultTitle: string;
  defaultSubtitle: string;
  columnOptions: Array<{ value: string; label: string }>;
  defaultVisibleColumns: string[];
  defaultPageSize?: number;
}): SettingTabDef {
  return {
    id: "display",
    label: "العرض والتصميم",
    fields: [
      field({
        key: "title",
        path: "display.title",
        label: "عنوان الصفحة",
        type: "string",
        defaultValue: opts.defaultTitle,
      }),
      field({
        key: "subtitle",
        path: "display.subtitle",
        label: "وصف الصفحة",
        type: "string",
        defaultValue: opts.defaultSubtitle,
      }),
      field({
        key: "showKpis",
        path: "display.showKpis",
        label: "إظهار بطاقات المؤشرات",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "pageSize",
        path: "display.pageSize",
        label: "عدد السجلات في الصفحة",
        type: "number",
        defaultValue: opts.defaultPageSize ?? 10,
        min: 5,
        max: 100,
      }),
      field({
        key: "visibleColumns",
        path: "display.visibleColumns",
        label: "الأعمدة الظاهرة",
        type: "multi-select",
        options: opts.columnOptions,
        defaultValue: opts.defaultVisibleColumns,
      }),
      field({
        key: "tableDensity",
        path: "display.tableDensity",
        label: "كثافة الجدول",
        type: "select",
        options: [
          { value: "comfortable", label: "مريحة" },
          { value: "compact", label: "مدمجة" },
        ],
        defaultValue: "comfortable",
      }),
      field({
        key: "mobileCards",
        path: "display.mobileCards",
        label: "عرض بطاقات على الموبايل",
        type: "boolean",
        defaultValue: true,
      }),
    ],
  };
}

/** Person-contact keys that settings must never hide or un-require (central rule). */
export const PERSON_CONTACT_LOCKED_SETTING_KEYS = ["phone", "country", "city"] as const;

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/**
 * Build locked + default required lists for person-bearing pages.
 * Always unions phone / country / city into locked required when those fields exist.
 */
export function withPersonContactLockedRequired(opts: {
  fieldOptions: Array<{ value: string; label: string }>;
  defaultRequired: string[];
  lockedRequired?: string[];
}): { defaultRequired: string[]; lockedRequired: string[] } {
  const available = new Set(opts.fieldOptions.map((o) => o.value));
  const contactLocked = PERSON_CONTACT_LOCKED_SETTING_KEYS.filter((k) => available.has(k));
  const lockedRequired = uniqueStrings([...(opts.lockedRequired ?? []), ...contactLocked]);
  const defaultRequired = uniqueStrings([...(opts.defaultRequired ?? []), ...lockedRequired]);
  return { defaultRequired, lockedRequired };
}

export function fieldsTab(opts: {
  fieldOptions: Array<{ value: string; label: string }>;
  defaultRequired: string[];
  defaultHidden?: string[];
  lockedRequired?: string[];
}): SettingTabDef {
  const { defaultRequired, lockedRequired } = withPersonContactLockedRequired({
    fieldOptions: opts.fieldOptions,
    defaultRequired: opts.defaultRequired,
    lockedRequired: opts.lockedRequired,
  });
  const lockedSet = new Set(lockedRequired);
  return {
    id: "fields",
    label: "الحقول والنماذج",
    fields: [
      field({
        key: "requiredFields",
        path: "fields.requiredFields",
        label: "الحقول الإلزامية — مقفل قانونيًا",
        type: "multi-select",
        options: opts.fieldOptions,
        defaultValue: defaultRequired,
        /** Per-chip lock: contact + page identity fields stay on; other required chips remain editable */
        lockedValues: lockedRequired,
      }),
      field({
        key: "hiddenOptionalFields",
        path: "fields.hiddenOptionalFields",
        label: "إخفاء حقول اختيارية",
        type: "multi-select",
        options: opts.fieldOptions.filter((o) => !lockedSet.has(o.value)),
        defaultValue: (opts.defaultHidden ?? []).filter((v) => !lockedSet.has(v)),
      }),
      field({
        key: "defaultStatus",
        path: "fields.defaultStatus",
        label: "القيمة الافتراضية للحالة",
        type: "string",
        defaultValue: "",
      }),
    ],
  };
}

export function actionsTab(defaults?: Partial<Record<string, boolean>>): SettingTabDef {
  const d = {
    allowCreate: true,
    allowView: true,
    allowEdit: true,
    allowDelete: true,
    allowArchive: true,
    allowExport: true,
    allowBulk: false,
    ...defaults,
  };
  return {
    id: "actions",
    label: "الإجراءات والتشغيل",
    fields: [
      field({ key: "allowCreate", path: "actions.allowCreate", label: "إنشاء سجل جديد", type: "boolean", defaultValue: d.allowCreate }),
      field({ key: "allowView", path: "actions.allowView", label: "عرض التفاصيل", type: "boolean", defaultValue: d.allowView, locked: true }),
      field({ key: "allowEdit", path: "actions.allowEdit", label: "التعديل", type: "boolean", defaultValue: d.allowEdit }),
      field({ key: "allowDelete", path: "actions.allowDelete", label: "الحذف", type: "boolean", defaultValue: d.allowDelete }),
      field({ key: "allowArchive", path: "actions.allowArchive", label: "الأرشفة", type: "boolean", defaultValue: d.allowArchive }),
      field({ key: "allowExport", path: "actions.allowExport", label: "التصدير والطباعة", type: "boolean", defaultValue: d.allowExport }),
      field({ key: "allowBulk", path: "actions.allowBulk", label: "إجراءات جماعية", type: "boolean", defaultValue: d.allowBulk }),
    ],
  };
}

export function permissionsTab(): SettingTabDef {
  const roleOpts = [
    { value: "admin", label: "مدير النظام" },
    { value: "lawyer", label: "محامٍ" },
    { value: "consultant", label: "مستشار" },
    { value: "employee", label: "موظف" },
    { value: "industrial_agent", label: "وكيل صناعي" },
    { value: "judge", label: "قاضٍ" },
  ];
  return {
    id: "permissions",
    label: "الصلاحيات",
    fields: [
      field({
        key: "canViewRoles",
        path: "permissions.canViewRoles",
        label: "من يشاهد الصفحة",
        type: "multi-select",
        options: roleOpts,
        defaultValue: ["admin", "lawyer", "consultant", "employee", "industrial_agent", "judge"],
        locked: true,
      }),
      field({
        key: "canCreateRoles",
        path: "permissions.canCreateRoles",
        label: "من ينشئ السجلات",
        type: "multi-select",
        options: roleOpts,
        defaultValue: ["admin", "lawyer", "consultant", "employee", "industrial_agent"],
      }),
      field({
        key: "canEditRoles",
        path: "permissions.canEditRoles",
        label: "من يعدّل السجلات",
        type: "multi-select",
        options: roleOpts,
        defaultValue: ["admin", "lawyer", "consultant", "employee", "industrial_agent"],
      }),
      field({
        key: "canDeleteRoles",
        path: "permissions.canDeleteRoles",
        label: "من يحذف / يؤرشف",
        type: "multi-select",
        options: roleOpts,
        defaultValue: ["admin", "lawyer"],
      }),
      field({
        key: "canExportRoles",
        path: "permissions.canExportRoles",
        label: "من يصدّر ويطبع",
        type: "multi-select",
        options: roleOpts,
        defaultValue: ["admin", "lawyer", "consultant", "industrial_agent"],
      }),
      field({
        key: "canManageSettingsRoles",
        path: "permissions.canManageSettingsRoles",
        label: "من يغيّر إعدادات الصفحة",
        type: "multi-select",
        options: roleOpts.filter((r) => r.value === "admin" || r.value === "industrial_agent"),
        defaultValue: ["admin"],
        locked: true,
      }),
    ],
  };
}

export function workflowTab(statuses: string[], defaultStatus: string): SettingTabDef {
  return {
    id: "workflow",
    label: "سير العمل",
    fields: [
      field({
        key: "statuses",
        path: "workflow.statuses",
        label: "حالات السجلات",
        type: "string-list",
        defaultValue: statuses,
      }),
      field({
        key: "initialStatus",
        path: "workflow.initialStatus",
        label: "الحالة الابتدائية",
        type: "select",
        options: statuses.map((s) => ({ value: s, label: s })),
        defaultValue: defaultStatus,
      }),
      field({
        key: "notifyOnStatusChange",
        path: "workflow.notifyOnStatusChange",
        label: "إشعار عند تغيير الحالة",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "escalateAfterDays",
        path: "workflow.escalateAfterDays",
        label: "أيام التصعيد عند التعطل",
        type: "number",
        defaultValue: 7,
        min: 0,
        max: 365,
      }),
    ],
  };
}

export function reportsTab(): SettingTabDef {
  return {
    id: "reports",
    label: "التقارير والطباعة",
    fields: [
      field({
        key: "allowPdf",
        path: "reports.allowPdf",
        label: "تصدير PDF",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "allowExcel",
        path: "reports.allowExcel",
        label: "تصدير Excel",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "showLogo",
        path: "reports.showLogo",
        label: "إظهار شعار نايوش في الطباعة",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "headerText",
        path: "reports.headerText",
        label: "نص الترويسة",
        type: "string",
        defaultValue: "NAIOSH Law — منظومة نايوش القانونية 360",
      }),
      field({
        key: "footerText",
        path: "reports.footerText",
        label: "نص التذييل",
        type: "string",
        defaultValue: "سري — للاستخدام الداخلي",
      }),
      field({
        key: "paperOrientation",
        path: "reports.paperOrientation",
        label: "اتجاه الورقة",
        type: "select",
        options: [
          { value: "portrait", label: "عمودي (Portrait)" },
          { value: "landscape", label: "أفقي (Landscape)" },
        ],
        defaultValue: "portrait",
      }),
      field({
        key: "allowCsv",
        path: "reports.allowCsv",
        label: "تصدير CSV",
        type: "boolean",
        defaultValue: true,
      }),
    ],
  };
}

export function linksTab(
  items: Array<{ key: string; label: string; defaultValue: boolean }>
): SettingTabDef {
  return {
    id: "links",
    label: "الربط",
    fields: items.map((item) =>
      field({
        key: item.key,
        path: `links.${item.key}`,
        label: item.label,
        type: "boolean",
        defaultValue: item.defaultValue,
      })
    ),
  };
}

export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function setByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const parts = path.split(".");
  const root = { ...obj };
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cur[key];
    const clone =
      next && typeof next === "object" && !Array.isArray(next)
        ? { ...(next as Record<string, unknown>) }
        : {};
    cur[key] = clone;
    cur = clone;
  }
  cur[parts[parts.length - 1]] = value;
  return root;
}

export function buildDefaultsFromTabs(tabs: SettingTabDef[]): Record<string, unknown> {
  let values: Record<string, unknown> = {};
  for (const tab of tabs) {
    for (const f of tab.fields) {
      values = setByPath(values, f.path, f.defaultValue);
    }
  }
  return values;
}

export function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      out[k] &&
      typeof out[k] === "object" &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMerge(
        out[k] as Record<string, unknown>,
        v as Record<string, unknown>
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}
