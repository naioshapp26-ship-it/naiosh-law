import { prisma } from "@/lib/prisma";
import type { Prisma, UserRole } from "@/generated/prisma/client";
import { getPageDefinition } from "./registry";
import { buildDefaultsFromTabs, deepMerge } from "./defaults";
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
  return buildDefaultsFromTabs(def.tabs);
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
          return { ok: false, error: `قيمة غير مسموحة في «${f.label}»` };
        }
      } else if (f.type === "multi-select" || f.type === "string-list") {
        if (!Array.isArray(value) || value.some((x) => typeof x !== "string")) {
          return { ok: false, error: `الحقل «${f.label}» يجب أن يكون قائمة نصوص` };
        }
        if (f.type === "multi-select" && f.options) {
          const allowed = new Set(f.options.map((o) => o.value));
          if (value.some((x) => !allowed.has(x as string))) {
            return { ok: false, error: `قيم غير مسموحة في «${f.label}»` };
          }
        }
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

  return { ok: true, values: merged };
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
      }),
      severity: "info",
    },
  });

  return { error: null, row };
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
  return savePageSettings({
    pageKey: opts.pageKey,
    scope,
    scopeId,
    values: defaults,
    userId: opts.userId,
    action: "reset",
  });
}
