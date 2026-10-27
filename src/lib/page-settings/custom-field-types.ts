import type { FormField } from "@/data/module-configs";

export type CustomFieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "checkbox";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  order?: number;
  visible?: boolean;
  /** Bind field to a page section id (notes/custom panels or record forms). */
  sectionId?: string;
  /**
   * record = per-row (module create/edit + table columns)
   * page = page-level panel value stored in sectionData
   */
  storage?: "record" | "page";
};

export type PageSectionDef = {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  /** kpis | table | actions | notes | custom */
  kind: "kpis" | "table" | "actions" | "notes" | "custom";
};

export function sanitizeFieldKey(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  if (!base) return `custom_${Date.now().toString(36)}`;
  if (/^[0-9]/.test(base)) return `f_${base}`;
  return base.startsWith("cf_") ? base : `cf_${base}`;
}

export function customFieldsToFormFields(defs: CustomFieldDef[]): FormField[] {
  return [...defs]
    .filter((d) => d.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((d) => {
      if (d.type === "select") {
        return {
          key: d.key,
          label: d.label,
          type: "select" as const,
          required: Boolean(d.required),
          options: d.options ?? [],
        };
      }
      if (d.type === "textarea") {
        return {
          key: d.key,
          label: d.label,
          type: "textarea" as const,
          required: Boolean(d.required),
        };
      }
      if (d.type === "number") {
        return {
          key: d.key,
          label: d.label,
          type: "number" as const,
          required: Boolean(d.required),
          placeholder: d.placeholder,
        };
      }
      if (d.type === "date") {
        return {
          key: d.key,
          label: d.label,
          type: "date" as const,
          required: Boolean(d.required),
        };
      }
      return {
        key: d.key,
        label: d.label,
        type: "text" as const,
        required: Boolean(d.required),
        placeholder: d.type === "checkbox" ? "نعم / لا" : d.placeholder,
      };
    });
}
