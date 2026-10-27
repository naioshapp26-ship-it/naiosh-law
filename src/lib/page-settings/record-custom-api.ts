import { resolvePageSettings } from "@/lib/page-settings/server";
import {
  extractCustomPayload,
  loadCustomValues,
  saveCustomValues,
  type CustomFieldDef,
} from "@/lib/page-settings/custom-fields";
import type { UserRole } from "@/generated/prisma/client";

export async function getModuleCustomFieldDefs(
  pageKey: string,
  opts?: { role?: UserRole | null; userId?: string | null }
): Promise<CustomFieldDef[]> {
  const resolved = await resolvePageSettings({
    pageKey,
    role: opts?.role,
    userId: opts?.userId,
  });
  const raw = resolved.values.customFields;
  if (!Array.isArray(raw)) return [];
  return raw as CustomFieldDef[];
}

export async function attachCustomValuesToRows<T extends { id: string }>(
  sourceModule: string,
  rows: T[]
): Promise<Array<T & Record<string, string>>> {
  const map = await loadCustomValues(
    sourceModule,
    rows.map((r) => r.id)
  );
  return rows.map((r) => ({
    ...r,
    ...(map.get(r.id) ?? {}),
  }));
}

export async function persistCustomFieldsFromBody(opts: {
  sourceModule: string;
  sourceId: string;
  body: Record<string, unknown>;
  userId?: string;
  role?: UserRole | null;
}) {
  const defs = await getModuleCustomFieldDefs(opts.sourceModule, {
    role: opts.role,
    userId: opts.userId,
  });
  if (defs.length === 0) return;
  const payload = extractCustomPayload(opts.body, defs);
  await saveCustomValues({
    sourceModule: opts.sourceModule,
    sourceId: opts.sourceId,
    values: payload,
    fieldKeys: defs.map((d) => d.key),
    userId: opts.userId,
  });
}
