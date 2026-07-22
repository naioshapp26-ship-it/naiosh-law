import type { FormField } from "@/data/module-configs";
import { NAIOSH_OWNERSHIP_TYPE_OPTIONS } from "@/data/naiosh-ownership-menu";

/** Detect Latin-only / technical labels that should be Arabic in the UI. */
const LATIN_ONLY = /^[\sA-Za-z0-9_\-./:()]+$/;

const STATUS_OPTIONS = ["نشط", "قيد المراجعة", "مكتمل", "معلق", "مؤرشف"];

/**
 * Every form field must show a clear Arabic label above the control —
 * never placeholder-only or raw English keys.
 */
export function assertFieldLabel(field: FormField): string {
  const label = String(field.label ?? "").trim();
  if (!label) {
    throw new Error(`حقل النموذج «${field.key}» بدون تسمية عربية ظاهرة`);
  }
  return label;
}

export function hasArabicLabel(label: string): boolean {
  const t = label.trim();
  if (!t) return false;
  // Accept Arabic script, or bilingual labels that include Arabic letters.
  return /[\u0600-\u06FF]/.test(t);
}

export function isTechnicalEnglishLabel(label: string): boolean {
  const t = label.trim();
  if (!t) return true;
  if (hasArabicLabel(t)) return false;
  return LATIN_ONLY.test(t);
}

export function sanitizeFormFields(fields: FormField[]): FormField[] {
  return fields.map((f) => ({
    ...f,
    label: assertFieldLabel(f),
  }));
}

function slugKey(label: string, index: number): string {
  const base = label
    .replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base ? `f_${base}_${index}` : `field_${index}`;
}

/**
 * Build labeled form fields from ERP Arabic column headers so every
 * «إضافة» modal shows the same name-above-field pattern.
 */
export function fieldsFromColumnLabels(columns: string[]): FormField[] {
  const fields: FormField[] = columns.map((raw, index) => {
    const label = String(raw ?? "").trim() || `الحقل ${index + 1}`;
    const key = slugKey(label, index);

    if (/حالة/.test(label)) {
      return { key, label, type: "select", required: true, options: [...STATUS_OPTIONS] };
    }
    if (/نوع الملكية/.test(label)) {
      return {
        key,
        label,
        type: "select",
        required: true,
        options: [...NAIOSH_OWNERSHIP_TYPE_OPTIONS],
      };
    }
    if (/جهة التوثيق/.test(label)) {
      return {
        key,
        label,
        type: "select",
        options: [
          "الهيئة السعودية للملكية الفكرية",
          "مكتب التوثيق",
          "وزارة الثقافة",
          "الشهر العقاري",
          "أخرى",
        ],
      };
    }
    if (/تاريخ|بداية|نهاية|موعد|استحقاق|تجديد/.test(label)) {
      return { key, label, type: "date" };
    }
    if (/مبلغ|عدد|نسبة|سعر|قيمة|ميزانية/.test(label)) {
      return { key, label, type: "number", placeholder: "0" };
    }
    if (/هاتف|جوال|موبايل/.test(label)) {
      return { key, label, type: "tel", placeholder: "05xxxxxxxx" };
    }
    if (/بريد|إيميل|email/i.test(label)) {
      return { key, label, type: "email" };
    }
    if (/وصف|ملاحظات|تفاصيل/.test(label)) {
      return { key, label, type: "textarea" };
    }

    return {
      key,
      label,
      type: "text",
      required: index === 0,
      placeholder: `أدخل ${label}`,
    };
  });

  if (!fields.some((f) => f.key.includes("ملاحظات") || f.label === "ملاحظات")) {
    fields.push({ key: "notes", label: "ملاحظات", type: "textarea" });
  }

  return sanitizeFormFields(fields);
}

/** Generic labeled create form when a page has no column schema. */
export function defaultLabeledCreateFields(entityTitle: string): FormField[] {
  return sanitizeFormFields([
    {
      key: "title",
      label: `اسم / عنوان ${entityTitle}`,
      type: "text",
      required: true,
      placeholder: `أدخل اسم ${entityTitle}`,
    },
    {
      key: "type",
      label: `نوع ${entityTitle}`,
      type: "text",
      placeholder: "اختر أو اكتب النوع",
    },
    {
      key: "status",
      label: "الحالة",
      type: "select",
      required: true,
      options: [...STATUS_OPTIONS],
    },
    {
      key: "startDate",
      label: "بداية التوثيق",
      type: "date",
    },
    {
      key: "endDate",
      label: "نهاية التوثيق",
      type: "date",
    },
    {
      key: "authority",
      label: "جهة التوثيق",
      type: "text",
      placeholder: "اسم جهة التوثيق",
    },
    {
      key: "requesterName",
      label: "اسم صاحب الطلب",
      type: "text",
      required: true,
      placeholder: "اسم صاحب الطلب",
    },
    {
      key: "notes",
      label: "ملاحظات",
      type: "textarea",
    },
  ]);
}

export function collectFormLabelIssues(fields: FormField[]): string[] {
  const issues: string[] = [];
  for (const f of fields) {
    const label = String(f.label ?? "").trim();
    if (!label) {
      issues.push(`${f.key}: تسمية فارغة`);
      continue;
    }
    if (isTechnicalEnglishLabel(label)) {
      issues.push(`${f.key}: تسمية إنجليزية/تقنية «${label}» — يلزم تسمية عربية`);
    }
  }
  return issues;
}
