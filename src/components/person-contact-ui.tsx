"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  UNSPECIFIED_CONTACT,
  formatPhoneDisplay,
  personContactFormFields,
  ensurePersonContactOnFormFields,
} from "@/lib/person-contact";
import type { FormField } from "@/data/module-configs";

/** RTL table headers placed immediately after the person-name column (dial → phone → geo → secondary). */
export const PERSON_CONTACT_TABLE_HEADERS = [
  "مفتاح الدولة",
  "رقم الجوال",
  "الدولة",
  "المدينة",
  "مفتاح الجوال الإضافي",
  "رقم جوال إضافي",
] as const;

export type PersonContactRow = {
  phone?: string | null;
  phoneDialCode?: string | null;
  phoneSecondary?: string | null;
  phoneSecondaryDialCode?: string | null;
  country?: string | null;
  city?: string | null;
  contactIncomplete?: boolean;
};

function display(value: string | null | undefined): string {
  const v = String(value ?? "").trim();
  if (!v || v === "—" || v === UNSPECIFIED_CONTACT) return UNSPECIFIED_CONTACT;
  return v;
}

function phoneCell(dial: string | null | undefined, phone: string | null | undefined): string {
  const p = String(phone ?? "").trim();
  if (!p || p === "—" || p === UNSPECIFIED_CONTACT) return UNSPECIFIED_CONTACT;
  // Already formatted with dial
  if (p.startsWith("+")) return p;
  return formatPhoneDisplay(dial, p);
}

/** Inject contact form fields after person name keys — single source for custom pages */
export function withPersonContactFormFields(
  fields: FormField[],
  opts?: { nameKeys?: readonly string[]; required?: boolean }
): FormField[] {
  return ensurePersonContactOnFormFields(fields, {
    required: opts?.required !== false,
    nameKeys: opts?.nameKeys ?? ["client", "clientName", "name", "requester", "guarantor"],
  });
}

/** Contact keys to forward from modal save into APIs */
export function contactPayloadFromForm(data: Record<string, unknown>) {
  return {
    clientId: data.clientId ? String(data.clientId) : undefined,
    phoneDialCode: data.phoneDialCode != null ? String(data.phoneDialCode) : undefined,
    phone: data.phone != null ? String(data.phone) : undefined,
    phoneSecondary: data.phoneSecondary != null ? String(data.phoneSecondary) : undefined,
    phoneSecondaryDialCode:
      data.phoneSecondaryDialCode != null ? String(data.phoneSecondaryDialCode) : undefined,
    country: data.country != null ? String(data.country) : undefined,
    city: data.city != null ? String(data.city) : undefined,
  };
}

export function PersonContactHeaderCells({ style }: { style?: CSSProperties }) {
  return (
    <>
      {PERSON_CONTACT_TABLE_HEADERS.map((h) => (
        <th key={h} style={style}>
          {h}
        </th>
      ))}
    </>
  );
}

export function PersonContactDataCells({
  row,
  style,
  mutedStyle,
}: {
  row: PersonContactRow;
  style?: CSSProperties;
  mutedStyle?: CSSProperties;
}) {
  const cell = (text: string): ReactNode => {
    const incomplete = text === UNSPECIFIED_CONTACT;
    return (
      <td style={incomplete && mutedStyle ? { ...style, ...mutedStyle } : style}>{text}</td>
    );
  };
  return (
    <>
      {cell(display(row.phoneDialCode))}
      {cell(phoneCell(row.phoneDialCode, row.phone))}
      {cell(display(row.country))}
      {cell(display(row.city))}
      {cell(display(row.phoneSecondaryDialCode))}
      {cell(phoneCell(row.phoneSecondaryDialCode, row.phoneSecondary))}
    </>
  );
}

/** Compact contact block for view modals */
export function PersonContactViewBlock({
  row,
  title = "بيانات الاتصال",
}: {
  row: PersonContactRow & { name?: string };
  title?: string;
}) {
  const items: { label: string; value: string }[] = [
    ...(row.name ? [{ label: "الاسم", value: display(row.name) }] : []),
    { label: "مفتاح الدولة", value: display(row.phoneDialCode) },
    { label: "رقم الجوال", value: phoneCell(row.phoneDialCode, row.phone) },
    { label: "الدولة", value: display(row.country) },
    { label: "المدينة", value: display(row.city) },
    { label: "مفتاح الجوال الإضافي", value: display(row.phoneSecondaryDialCode) },
    { label: "رقم جوال إضافي", value: phoneCell(row.phoneSecondaryDialCode, row.phoneSecondary) },
  ];
  return (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ fontWeight: 800, fontSize: "0.85rem", color: "#101D32", marginBottom: "0.65rem" }}>
        {title}
      </p>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}
        className="person-contact-view-grid"
      >
        {items.map((it) => (
          <div
            key={it.label}
            style={{ background: "#f8f9fb", borderRadius: 10, padding: "0.7rem 0.85rem" }}
          >
            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>
              {it.label}
            </p>
            <p
              style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: it.value === UNSPECIFIED_CONTACT ? "#94a3b8" : "#0a0a12",
                fontStyle: it.value === UNSPECIFIED_CONTACT ? "italic" : "normal",
              }}
            >
              {it.value}
            </p>
          </div>
        ))}
      </div>
      <style>{`@media (max-width: 600px) { .person-contact-view-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

export { personContactFormFields, UNSPECIFIED_CONTACT };
