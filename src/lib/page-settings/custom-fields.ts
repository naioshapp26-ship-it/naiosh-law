import { prisma } from "@/lib/prisma";
import type { CustomFieldDef } from "./custom-field-types";

export type { CustomFieldDef, PageSectionDef } from "./custom-field-types";
export { sanitizeFieldKey, customFieldsToFormFields } from "./custom-field-types";

export async function loadCustomValues(
  sourceModule: string,
  sourceIds: string[]
): Promise<Map<string, Record<string, string>>> {
  if (sourceIds.length === 0) return new Map();
  const rows = await prisma.recordCustomValue.findMany({
    where: { sourceModule, sourceId: { in: sourceIds } },
  });
  const map = new Map<string, Record<string, string>>();
  for (const r of rows) {
    const cur = map.get(r.sourceId) ?? {};
    cur[r.fieldKey] = r.valueText ?? (r.valueJson != null ? JSON.stringify(r.valueJson) : "");
    map.set(r.sourceId, cur);
  }
  return map;
}

export async function saveCustomValues(opts: {
  sourceModule: string;
  sourceId: string;
  values: Record<string, unknown>;
  fieldKeys: string[];
  userId?: string;
}) {
  const ops = [];
  for (const key of opts.fieldKeys) {
    if (!(key in opts.values)) continue;
    const raw = opts.values[key];
    const valueText = raw == null ? null : String(raw);
    ops.push(
      prisma.recordCustomValue.upsert({
        where: {
          sourceModule_sourceId_fieldKey: {
            sourceModule: opts.sourceModule,
            sourceId: opts.sourceId,
            fieldKey: key,
          },
        },
        create: {
          sourceModule: opts.sourceModule,
          sourceId: opts.sourceId,
          fieldKey: key,
          valueText,
          updatedById: opts.userId,
        },
        update: {
          valueText,
          updatedById: opts.userId,
        },
      })
    );
  }
  if (ops.length) await prisma.$transaction(ops);
}

export function extractCustomPayload(
  body: Record<string, unknown>,
  defs: CustomFieldDef[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const d of defs) {
    if (d.key in body) out[d.key] = body[d.key];
  }
  return out;
}
