/**
 * Permanent design rule — case number identity (client-safe)
 * ─────────────────────────────────────────────────────────
 * Any table/form that deals with an actual Case must show Case.caseNo from
 * PostgreSQL as the first RTL column. Never hide it via page settings.
 * Never fabricate case numbers. Clients may exist without a case
 * («لا توجد قضية مرتبطة»). Uncertain legacy caseRef text is shown for review,
 * never auto-linked to a wrong Case.
 */

import type { Column, FormField } from "@/data/module-configs";

export const NO_LINKED_CASE = "لا توجد قضية مرتبطة";
export const CASE_LINK_REVIEW = "يحتاج مراجعة الربط";

export const CASE_NO_KEY = "caseNo" as const;
export const CASE_ID_KEY = "caseId" as const;

/** Modules whose tables/forms must surface case identity (real Case link). */
export const CASE_BEARING_MODULE_SLUGS = new Set([
  "case-management",
  "clients-management",
  "court-sessions",
  "follow-up-center",
  "legal-accounting",
  "legal-services",
  "legal-consultations",
  "complaints-management",
  "internal-requests",
]);

/** Child records that must pick an existing Case on create/edit. */
export const CASE_PICKER_REQUIRED_SLUGS = new Set([
  "court-sessions",
  "follow-up-center",
  "legal-accounting",
  "legal-services",
  "complaints-management",
]);

export type CaseLink = {
  id: string;
  caseNo: string;
};

export type CaseResolveResult =
  | { status: "linked"; case: CaseLink }
  | { status: "none" }
  | { status: "review"; raw: string };

export function formatCaseLinksLabel(links: CaseLink[]): string {
  if (!links.length) return NO_LINKED_CASE;
  return links.map((c) => c.caseNo).join(" · ");
}

export function displayResolvedCase(result: CaseResolveResult): {
  caseNo: string;
  caseId: string | null;
  caseLinks: CaseLink[];
  caseLinkStatus: CaseResolveResult["status"];
} {
  if (result.status === "linked") {
    return {
      caseNo: result.case.caseNo,
      caseId: result.case.id,
      caseLinks: [result.case],
      caseLinkStatus: "linked",
    };
  }
  if (result.status === "review") {
    return {
      caseNo: `${CASE_LINK_REVIEW}: ${result.raw}`,
      caseId: null,
      caseLinks: [],
      caseLinkStatus: "review",
    };
  }
  return {
    caseNo: NO_LINKED_CASE,
    caseId: null,
    caseLinks: [],
    caseLinkStatus: "none",
  };
}

/** Ensure caseNo is the first column (RTL rightmost). */
export function ensureCaseNoOnColumns(
  columns: Column[],
  opts?: { label?: string; type?: Column["type"] }
): Column[] {
  const label = opts?.label ?? "رقم القضية";
  const type = opts?.type ?? "case-links";
  const without = columns.filter((c) => c.key !== CASE_NO_KEY && c.key !== "caseRef");
  const existing = columns.find((c) => c.key === CASE_NO_KEY);
  const caseCol: Column = existing
    ? { ...existing, label: existing.label || label, type: existing.type ?? type }
    : { key: CASE_NO_KEY, label, type };
  return [caseCol, ...without];
}

/** Ensure case-select field leads the form (except clients — display only). */
export function ensureCaseNoOnFormFields(
  fields: FormField[],
  opts?: { required?: boolean; readOnly?: boolean }
): FormField[] {
  const required = opts?.required ?? true;
  const without = fields.filter(
    (f) => f.key !== CASE_NO_KEY && f.key !== CASE_ID_KEY && f.key !== "caseRef"
  );
  const existing = fields.find((f) => f.key === CASE_NO_KEY);
  const caseField: FormField = existing
    ? {
        ...existing,
        type: "case-select",
        required: required || existing.required,
        label: existing.label || "رقم القضية",
        readOnly: opts?.readOnly ?? existing.readOnly,
      }
    : {
        key: CASE_NO_KEY,
        label: "رقم القضية",
        type: "case-select",
        required,
        readOnly: opts?.readOnly,
      };
  return [caseField, ...without];
}

export const CLIENT_CASE_IDS_KEY = "caseIds" as const;

/** Multi case-link picker for client add/edit (optional — client may exist alone). */
export function ensureClientCaseLinksOnFormFields(fields: FormField[]): FormField[] {
  const without = fields.filter(
    (f) =>
      f.key !== CLIENT_CASE_IDS_KEY &&
      f.key !== CASE_NO_KEY &&
      f.key !== CASE_ID_KEY &&
      f.key !== "caseRef" &&
      f.type !== "case-multi-select"
  );
  const existing = fields.find(
    (f) => f.key === CLIENT_CASE_IDS_KEY || f.type === "case-multi-select"
  );
  const caseField: FormField = existing
    ? {
        ...existing,
        key: CLIENT_CASE_IDS_KEY,
        type: "case-multi-select",
        required: false,
        label: existing.label || "رقم القضية / القضايا المرتبطة",
      }
    : {
        key: CLIENT_CASE_IDS_KEY,
        label: "رقم القضية / القضايا المرتبطة",
        type: "case-multi-select",
        required: false,
        placeholder: "ابحث برقم القضية أو اسمها واختر من السجل الحقيقي",
      };
  // Place after name when present, otherwise lead the form
  const nameIdx = without.findIndex((f) => f.key === "name");
  if (nameIdx >= 0) {
    return [
      ...without.slice(0, nameIdx + 1),
      caseField,
      ...without.slice(nameIdx + 1),
    ];
  }
  return [caseField, ...without];
}

export function withCaseNoLockedVisible(
  columnOptions: Array<{ value: string; label: string }>,
  defaultVisible: string[]
): {
  columnOptions: Array<{ value: string; label: string }>;
  defaultVisible: string[];
  lockedVisible: string[];
} {
  const has = columnOptions.some((c) => c.value === CASE_NO_KEY);
  const opts = has
    ? columnOptions
    : [{ value: CASE_NO_KEY, label: "رقم القضية" }, ...columnOptions];
  const reordered = [
    ...opts.filter((c) => c.value === CASE_NO_KEY),
    ...opts.filter((c) => c.value !== CASE_NO_KEY),
  ];
  const visible = [...new Set([CASE_NO_KEY, ...defaultVisible.filter((v) => v !== "caseRef")])];
  return { columnOptions: reordered, defaultVisible: visible, lockedVisible: [CASE_NO_KEY] };
}
