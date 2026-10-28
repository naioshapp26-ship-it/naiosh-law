import { prisma } from "@/lib/prisma";
import type { Prisma, UserRole } from "@/generated/prisma/client";
import { getPageDefinition } from "./registry";
import {
  buildDefaultsFromTabs,
  deepMerge,
  PERSON_CONTACT_LOCKED_SETTING_KEYS,
} from "./defaults";
import type {
  PageSettingsScope,
  ResolvedPageSettings,
  SettingFieldDef,
} from "./types";

export function normalizeScopeId(scope: PageSettingsScope, scopeId?: string | null) {
  if (scope === "global") return "";
  return (scopeId ?? "").trim();
}

export function canManagePageSettings(
  role: UserRole,
  pageKey: string
): boolean {
  const def = getPageDefinition(pageKey);
  if (!def) return role === "admin";
  return def.manageRoles.includes(role);
}

/** Clients must never manage staff page settings */
export function assertNotClient(role: UserRole) {
  return role !== "client";
}

export function collectFields(pageKey: string): SettingFieldDef[] {
  const def = getPageDefinition(pageKey);
  if (!def) return [];
  return def.tabs.flatMap((t) => t.fields);
}

export function getDefaultValues(pageKey: string): Record<string, unknown> {
  const def = getPageDefinition(pageKey);
  if (!def) return {};
  const base = buildDefaultsFromTabs(def.tabs);
  return {
    ...base,
    customFields: [],
    sections: defaultSectionsFor(pageKey),
    sectionData: {},
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/** Validate and strip unknown keys; enforce locked defaults */
export function validateAndNormalizeValues(
  pageKey: string,
  incoming: Record<string, unknown>
): { ok: true; values: Record<string, unknown> } | { ok: false; error: string } {
  const def = getPageDefinition(pageKey);
  if (!def) return { ok: false, error: "صفحة الإعدادات غير معرّفة" };

  const defaults = buildDefaultsFromTabs(def.tabs);
  let merged = deepMerge(defaults, incoming);

  for (const tab of def.tabs) {
    for (const f of tab.fields) {
      const parts = f.path.split(".");
      let cur: unknown = merged;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!isPlainObject(cur)) break;
        cur = cur[parts[i]];
      }
      if (!isPlainObject(cur)) continue;
      const key = parts[parts.length - 1];
      let value = cur[key];

      if (f.locked) {
        cur[key] = f.defaultValue;
        continue;
      }

      if (f.type === "boolean") {
        if (typeof value !== "boolean") {
          return { ok: false, error: `الحقل «${f.label}» يجب أن يكون نعم/لا` };
        }
      } else if (f.type === "number") {
        const n = Number(value);
        if (!Number.isFinite(n)) {
          return { ok: false, error: `الحقل «${f.label}» يجب أن يكون رقمًا` };
        }
        if (f.min != null && n < f.min) {
          return { ok: false, error: `الحقل «${f.label}» أقل من الحد الأدنى` };
        }
        if (f.max != null && n > f.max) {
          return { ok: false, error: `الحقل «${f.label}» أكبر من الحد الأقصى` };
        }
        cur[key] = n;
      } else if (f.type === "string") {
        if (typeof value !== "string") {
          return { ok: false, error: `الحقل «${f.label}» يجب أن يكون نصًا` };
        }
      } else if (f.type === "select") {
        if (typeof value !== "string") {
          return { ok: false, error: `الحقل «${f.label}» غير صالح` };
        }
        if (f.options && !f.options.some((o) => o.value === value)) {
          // Allow workflow.initialStatus when it appears in the saved statuses list
          const wfStatuses = Array.isArray(
            (merged as { workflow?: { statuses?: unknown } }).workflow?.statuses
          )
            ? ((merged as { workflow: { statuses: string[] } }).workflow.statuses as string[])
            : [];
          const incomingStatuses = Array.isArray(
            (incoming as { workflow?: { statuses?: unknown } }).workflow?.statuses
          )
            ? ((incoming as { workflow: { statuses: string[] } }).workflow.statuses as string[])
            : [];
          const allowedDynamic = new Set([...wfStatuses, ...incomingStatuses]);
          if (!(f.path === "workflow.initialStatus" && allowedDynamic.has(value))) {
            return { ok: false, error: `قيمة غير مسموحة في «${f.label}»` };
          }
        }
      } else if (f.type === "multi-select" || f.type === "string-list") {
        if (!Array.isArray(value) || value.some((x) => typeof x !== "string")) {
          return { ok: false, error: `الحقل «${f.label}» يجب أن يكون قائمة نصوص` };
        }
        let list = value as string[];
        if (f.type === "multi-select" && f.options) {
          const allowed = new Set(f.options.map((o) => o.value));
          // Strip unknown / retired options (legacy settings) instead of rejecting saves
          list = list.filter((x) => allowed.has(x));
        }
        // Per-chip legal locks: always keep lockedValues selected
        if (f.lockedValues?.length) {
          const lockSet = new Set(f.lockedValues);
          list = [...new Set([...list, ...f.lockedValues.filter((v) => {
            if (!f.options?.length) return true;
            return f.options.some((o) => o.value === v);
          })])];
          // Prefer stable order: locked first (as defined), then the rest
          const rest = list.filter((x) => !lockSet.has(x));
          list = [...f.lockedValues.filter((v) => list.includes(v)), ...rest];
        }
        cur[key] = list;
      }
    }
  }

  // Re-apply locked after merge (safety)
  merged = deepMerge(merged, {});
  for (const tab of def.tabs) {
    for (const f of tab.fields) {
      if (!f.locked) continue;
      const parts = f.path.split(".");
      let cur: Record<string, unknown> = merged;
      for (let i = 0; i < parts.length - 1; i++) {
        const next = cur[parts[i]];
        if (!isPlainObject(next)) {
          cur[parts[i]] = {};
        }
        cur = cur[parts[i]] as Record<string, unknown>;
      }
      cur[parts[parts.length - 1]] = f.defaultValue;
    }
  }

  // Central person-contact + caseNo rule: never hide locked chips via settings
  {
    const chipLocks = new Set<string>(PERSON_CONTACT_LOCKED_SETTING_KEYS);
    for (const tab of def.tabs) {
      for (const f of tab.fields) {
        for (const v of f.lockedValues ?? []) chipLocks.add(v);
      }
    }
    const fieldsObj = isPlainObject(merged.fields)
      ? (merged.fields as Record<string, unknown>)
      : null;
    if (fieldsObj) {
      if (Array.isArray(fieldsObj.requiredFields)) {
        const req = (fieldsObj.requiredFields as string[]).filter(
          (x) => typeof x === "string"
        );
        const requiredFieldDef = collectFields(pageKey).find(
          (f) => f.path === "fields.requiredFields"
        );
        const allowedReq = new Set(
          (requiredFieldDef?.options ?? []).map((o) => o.value)
        );
        const mustKeep = [...chipLocks].filter(
          (k) => allowedReq.size === 0 || allowedReq.has(k)
        );
        fieldsObj.requiredFields = [...new Set([...req, ...mustKeep])];
      }
      if (Array.isArray(fieldsObj.hiddenOptionalFields)) {
        fieldsObj.hiddenOptionalFields = (
          fieldsObj.hiddenOptionalFields as string[]
        ).filter((x) => typeof x === "string" && !chipLocks.has(x));
      }
    }
    const displayObj = isPlainObject(merged.display)
      ? (merged.display as Record<string, unknown>)
      : null;
    if (displayObj && Array.isArray(displayObj.visibleColumns)) {
      const cols = (displayObj.visibleColumns as string[]).filter(
        (x) => typeof x === "string"
      );
      const visibleDef = collectFields(pageKey).find(
        (f) => f.path === "display.visibleColumns"
      );
      const lockedVisible = visibleDef?.lockedValues ?? [];
      const allowedCols = new Set((visibleDef?.options ?? []).map((o) => o.value));
      const mustKeepCols = lockedVisible.filter(
        (k) => allowedCols.size === 0 || allowedCols.has(k)
      );
      displayObj.visibleColumns = [...new Set([...mustKeepCols, ...cols])];
    }
  }

  // Preserve no-code extensions (not represented as flat SettingFieldDef)
  if (Array.isArray(incoming.customFields)) {
    const cleaned = sanitizeCustomFields(incoming.customFields);
    if (!cleaned.ok) return { ok: false, error: cleaned.error };
    merged.customFields = cleaned.fields;
  } else if (!Array.isArray(merged.customFields)) {
    merged.customFields = [];
  }

  if (Array.isArray(incoming.sections)) {
    const cleaned = sanitizeSections(incoming.sections);
    if (!cleaned.ok) return { ok: false, error: cleaned.error };
    merged.sections = cleaned.sections;
  } else if (!Array.isArray(merged.sections)) {
    merged.sections = defaultSectionsFor(pageKey);
  }

  // Page-level No-Code section values (notes/custom panels)
  if (incoming.sectionData != null) {
    if (!isPlainObject(incoming.sectionData)) {
      return { ok: false, error: "sectionData يجب أن يكون كائنًا" };
    }
    const out: Record<string, Record<string, unknown>> = {};
    for (const [sid, payload] of Object.entries(incoming.sectionData)) {
      if (!isPlainObject(payload)) continue;
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(payload)) {
        const key = String(k).slice(0, 64);
        if (v == null) cleaned[key] = "";
        else if (typeof v === "boolean" || typeof v === "number") cleaned[key] = v;
        else cleaned[key] = String(v).slice(0, 8000);
      }
      out[String(sid).slice(0, 64)] = cleaned;
    }
    merged.sectionData = out;
  } else if (isPlainObject(merged.sectionData)) {
    // keep existing from merge
  } else {
    merged.sectionData = {};
  }

  return { ok: true, values: merged };
}

function sanitizeCustomFields(
  raw: unknown
): { ok: true; fields: Array<Record<string, unknown>> } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "الحقول المخصصة يجب أن تكون قائمة" };
  if (raw.length > 40) return { ok: false, error: "الحد الأقصى 40 حقلًا مخصصًا" };
  const allowedTypes = new Set(["text", "number", "date", "select", "textarea", "checkbox"]);
  const seen = new Set<string>();
  const fields: Array<Record<string, unknown>> = [];
  for (const item of raw) {
    if (!isPlainObject(item)) return { ok: false, error: "تعريف حقل مخصص غير صالح" };
    let key = String(item.key ?? "").trim();
    const label = String(item.label ?? "").trim();
    const type = String(item.type ?? "text");
    if (!label) return { ok: false, error: "كل حقل مخصص يحتاج تسمية" };
    if (!allowedTypes.has(type)) return { ok: false, error: `نوع حقل غير مدعوم: ${type}` };
    if (!key) {
      key = `cf_${Date.now().toString(36)}_${fields.length}`;
    }
    if (!key.startsWith("cf_")) key = `cf_${key}`;
    if (seen.has(key)) return { ok: false, error: `مفتاح حقل مكرر: ${key}` };
    seen.add(key);
    const options = Array.isArray(item.options)
      ? item.options.map((o) => String(o)).filter(Boolean).slice(0, 50)
      : [];
    const sectionId =
      item.sectionId != null && String(item.sectionId).trim()
        ? String(item.sectionId).trim().slice(0, 64)
        : undefined;
    const storageRaw = String(item.storage ?? "").trim();
    const storage =
      storageRaw === "page" || storageRaw === "record" ? storageRaw : undefined;
    fields.push({
      key,
      label: label.slice(0, 80),
      type,
      required: Boolean(item.required),
      options: type === "select" ? options : undefined,
      placeholder: item.placeholder != null ? String(item.placeholder).slice(0, 120) : undefined,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : fields.length,
      visible: item.visible !== false,
      sectionId,
      storage,
    });
  }
  return { ok: true, fields };
}

function sanitizeSections(
  raw: unknown
): { ok: true; sections: Array<Record<string, unknown>> } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "الأقسام يجب أن تكون قائمة" };
  const allowedKinds = new Set(["kpis", "table", "actions", "notes", "custom"]);
  const sections: Array<Record<string, unknown>> = [];
  for (const item of raw) {
    if (!isPlainObject(item)) return { ok: false, error: "تعريف قسم غير صالح" };
    const id = String(item.id ?? "").trim();
    const title = String(item.title ?? "").trim();
    const kind = String(item.kind ?? "custom");
    if (!id || !title) return { ok: false, error: "كل قسم يحتاج معرفًا وعنوانًا" };
    if (!allowedKinds.has(kind)) return { ok: false, error: `نوع قسم غير مدعوم: ${kind}` };
    const scopeRaw = String(item.scope ?? "").trim();
    const scope =
      scopeRaw === "record" || scopeRaw === "page"
        ? scopeRaw
        : kind === "notes" || kind === "custom"
          ? "page"
          : undefined;
    sections.push({
      id,
      title: title.slice(0, 80),
      kind,
      visible: item.visible !== false,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : sections.length,
      scope,
    });
  }
  return { ok: true, sections };
}

export function defaultSectionsFor(pageKey: string): Array<Record<string, unknown>> {
  void pageKey;
  return [
    { id: "kpis", title: "بطاقات المؤشرات", kind: "kpis", visible: true, order: 0 },
    { id: "table", title: "جدول البيانات", kind: "table", visible: true, order: 1 },
    { id: "actions", title: "شريط الإجراءات", kind: "actions", visible: true, order: 2 },
    {
      id: "notes",
      title: "ملاحظات عامة للصفحة",
      kind: "notes",
      visible: false,
      order: 3,
      scope: "page",
    },
  ];
}

export async function resolvePageSettings(opts: {
  pageKey: string;
  role?: UserRole | null;
  userId?: string | null;
  officeBranchId?: string | null;
}): Promise<ResolvedPageSettings> {
  const defaults = getDefaultValues(opts.pageKey);
  const scopes: Array<{ scope: PageSettingsScope; scopeId: string }> = [
    { scope: "global", scopeId: "" },
  ];
  if (opts.officeBranchId) {
    scopes.push({ scope: "office", scopeId: opts.officeBranchId });
  }
  if (opts.role) {
    scopes.push({ scope: "role", scopeId: opts.role });
  }
  if (opts.userId) {
    scopes.push({ scope: "user", scopeId: opts.userId });
  }

  const rows = await prisma.pageSetting.findMany({
    where: {
      pageKey: opts.pageKey,
      OR: scopes.map((s) => ({ scope: s.scope, scopeId: s.scopeId })),
    },
  });

  const byKey = new Map(rows.map((r) => [`${r.scope}:${r.scopeId}`, r]));
  let values = { ...defaults };
  let applied: PageSettingsScope = "global";
  let version: number | null = null;
  let updatedAt: string | null = null;
  let updatedById: string | null = null;

  for (const s of scopes) {
    const row = byKey.get(`${s.scope}:${s.scopeId}`);
    if (!row) continue;
    const raw = (row.values ?? {}) as Record<string, unknown>;
    values = deepMerge(values, raw);
    applied = s.scope;
    version = row.version;
    updatedAt = row.updatedAt.toISOString();
    updatedById = row.updatedById;
  }

  // Locked defaults always win
  const validated = validateAndNormalizeValues(opts.pageKey, values);
  if (validated.ok) values = validated.values;

  return {
    pageKey: opts.pageKey,
    values,
    defaults,
    scopeApplied: applied,
    version,
    updatedAt,
    updatedById,
  };
}

export async function savePageSettings(opts: {
  pageKey: string;
  scope: PageSettingsScope;
  scopeId?: string | null;
  values: Record<string, unknown>;
  userId: string;
  action?: "create" | "update" | "reset" | "restore";
}) {
  const scopeId = normalizeScopeId(opts.scope, opts.scopeId);
  const validated = validateAndNormalizeValues(opts.pageKey, opts.values);
  if (!validated.ok) {
    return { error: validated.error as string, row: null };
  }

  const existing = await prisma.pageSetting.findUnique({
    where: {
      pageKey_scope_scopeId: {
        pageKey: opts.pageKey,
        scope: opts.scope,
        scopeId,
      },
    },
  });

  const action =
    opts.action ?? (existing ? "update" : "create");

  const valuesJson = validated.values as Prisma.InputJsonValue;

  const row = await prisma.pageSetting.upsert({
    where: {
      pageKey_scope_scopeId: {
        pageKey: opts.pageKey,
        scope: opts.scope,
        scopeId,
      },
    },
    create: {
      pageKey: opts.pageKey,
      scope: opts.scope,
      scopeId,
      values: valuesJson,
      version: 1,
      updatedById: opts.userId,
    },
    update: {
      values: valuesJson,
      version: { increment: 1 },
      updatedById: opts.userId,
    },
  });

  // Snapshot previous values for safe restore (no-code undo)
  if (existing) {
    await prisma.pageSettingVersion.create({
      data: {
        pageKey: opts.pageKey,
        scope: opts.scope,
        scopeId,
        version: existing.version,
        values: existing.values as Prisma.InputJsonValue,
        label: action === "reset" ? "قبل الاستعادة للافتراضي" : `نسخة v${existing.version}`,
        createdById: opts.userId,
      },
    });
  }

  await prisma.pageSettingAudit.create({
    data: {
      pageKey: opts.pageKey,
      scope: opts.scope,
      scopeId,
      action,
      beforeJson: existing ? (existing.values as object) : undefined,
      afterJson: valuesJson,
      changedById: opts.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: opts.userId,
      action: `page-settings.${action}`,
      entity: "PageSetting",
      entityId: row.id,
      details: JSON.stringify({
        pageKey: opts.pageKey,
        scope: opts.scope,
        scopeId,
        version: row.version,
      }),
      severity: "info",
    },
  });

  return { error: null, row };
}

export async function listPageSettingVersions(opts: {
  pageKey: string;
  scope?: PageSettingsScope;
  scopeId?: string | null;
  limit?: number;
}) {
  const scope = opts.scope ?? "global";
  const scopeId = normalizeScopeId(scope, opts.scopeId);
  return prisma.pageSettingVersion.findMany({
    where: { pageKey: opts.pageKey, scope, scopeId },
    orderBy: { createdAt: "desc" },
    take: Math.min(opts.limit ?? 20, 50),
  });
}

export async function restorePageSettingVersion(opts: {
  pageKey: string;
  versionId: string;
  userId: string;
}) {
  const snap = await prisma.pageSettingVersion.findUnique({ where: { id: opts.versionId } });
  if (!snap || snap.pageKey !== opts.pageKey) {
    return { error: "النسخة غير موجودة", row: null };
  }
  return savePageSettings({
    pageKey: opts.pageKey,
    scope: snap.scope as PageSettingsScope,
    scopeId: snap.scopeId,
    values: (snap.values ?? {}) as Record<string, unknown>,
    userId: opts.userId,
    action: "restore",
  });
}

export async function resetPageSettings(opts: {
  pageKey: string;
  scope?: PageSettingsScope;
  scopeId?: string | null;
  userId: string;
}) {
  const scope = opts.scope ?? "global";
  const scopeId = normalizeScopeId(scope, opts.scopeId);
  const defaults = getDefaultValues(opts.pageKey);
  // Restore design defaults but keep No-Code content:
  // - customFields definitions (so per-record values remain addressable)
  // - sectionData (page-level panel values)
  // - custom/notes sections the admin added (layout presence)
  // RecordCustomValue rows are never deleted by settings reset.
  const previous = await resolvePageSettings({
    pageKey: opts.pageKey,
    userId: opts.userId,
  });
  const prev = previous.values as {
    sectionData?: unknown;
    customFields?: unknown;
    sections?: unknown;
  };
  const prevSections = Array.isArray(prev.sections) ? prev.sections : [];
  const keptCustom = prevSections.filter(
    (s) =>
      s &&
      typeof s === "object" &&
      ((s as { kind?: string }).kind === "custom" || (s as { kind?: string }).kind === "notes")
  );
  const baseSections = defaultSectionsFor(opts.pageKey).filter(
    (s) => s.kind === "kpis" || s.kind === "table" || s.kind === "actions"
  );
  const values = {
    ...defaults,
    customFields: Array.isArray(prev.customFields) ? prev.customFields : [],
    sectionData:
      prev.sectionData && typeof prev.sectionData === "object" && !Array.isArray(prev.sectionData)
        ? prev.sectionData
        : {},
    sections: [...baseSections, ...keptCustom],
  };
  return savePageSettings({
    pageKey: opts.pageKey,
    scope,
    scopeId,
    values,
    userId: opts.userId,
    action: "reset",
  });
}
