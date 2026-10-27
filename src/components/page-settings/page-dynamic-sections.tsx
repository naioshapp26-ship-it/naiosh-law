"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomFieldDef, PageSectionDef } from "@/lib/page-settings/custom-field-types";

export type SectionDataMap = Record<string, Record<string, unknown>>;

type Props = {
  pageKey: string;
  sections?: PageSectionDef[] | unknown[] | null;
  customFields?: CustomFieldDef[] | unknown[] | null;
  sectionData?: SectionDataMap | null;
  canWrite?: boolean;
  /** When false, skip built-in kpis/table/actions (caller renders those). Default true for standalone pages. */
  includeBuiltins?: boolean;
  className?: string;
  onSaved?: (next: SectionDataMap) => void;
};

function asSections(raw: unknown): PageSectionDef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is PageSectionDef => Boolean(s && typeof s === "object" && (s as PageSectionDef).id))
    .map((s) => s as PageSectionDef)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function asFields(raw: unknown): CustomFieldDef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is CustomFieldDef => Boolean(f && typeof f === "object" && (f as CustomFieldDef).key))
    .map((f) => f as CustomFieldDef)
    .filter((f) => f.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function fieldStorage(
  f: CustomFieldDef,
  section?: Pick<PageSectionDef, "kind" | "scope">
): "record" | "page" {
  if (f.storage === "record" || f.storage === "page") return f.storage;
  if (section?.scope === "record") return "record";
  if (section?.scope === "page") return "page";
  if (f.sectionId && (section?.kind === "notes" || section?.kind === "custom")) return "page";
  return "record";
}

export function sectionScope(sec: PageSectionDef): "page" | "record" {
  if (sec.scope === "record" || sec.scope === "page") return sec.scope;
  return "page";
}

export function pageScopedFieldsForSection(
  fields: CustomFieldDef[],
  section: PageSectionDef
): CustomFieldDef[] {
  return fields.filter((f) => {
    if (f.sectionId !== section.id) return false;
    return fieldStorage(f, section) === "page";
  });
}

/** Dynamic No-Code panels for notes/custom page sections (saved in PostgreSQL sectionData). */
export function PageDynamicSections({
  pageKey,
  sections: sectionsRaw,
  customFields: fieldsRaw,
  sectionData: initialData,
  canWrite = false,
  includeBuiltins = false,
  className,
  onSaved,
}: Props) {
  const sections = useMemo(() => asSections(sectionsRaw), [sectionsRaw]);
  const fields = useMemo(() => asFields(fieldsRaw), [fieldsRaw]);
  const [data, setData] = useState<SectionDataMap>(initialData ?? {});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData ?? {});
  }, [initialData, pageKey]);

  const panels = useMemo(() => {
    return sections.filter((s) => {
      if (s.visible === false) return false;
      if (s.kind === "notes" || s.kind === "custom") {
        // Only shared page-level panels here; record-scoped render elsewhere
        return sectionScope(s) === "page";
      }
      if (includeBuiltins) return s.kind === "kpis" || s.kind === "table" || s.kind === "actions";
      return false;
    });
  }, [sections, includeBuiltins]);

  const setField = useCallback((sectionId: string, key: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] ?? {}), [key]: value },
    }));
  }, []);

  const saveSection = useCallback(
    async (sectionId: string) => {
      setSavingId(sectionId);
      setMsg(null);
      try {
        const res = await fetch(
          `/api/page-settings/${encodeURIComponent(pageKey)}/section-data`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionId,
              data: data[sectionId] ?? {},
            }),
          }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "فشل حفظ القسم");
        const next = (body.sectionData ?? data) as SectionDataMap;
        setData(next);
        onSaved?.(next);
        setMsg("تم حفظ محتوى القسم في PostgreSQL");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "فشل الحفظ");
      } finally {
        setSavingId(null);
      }
    },
    [pageKey, data, onSaved]
  );

  if (panels.length === 0) return null;

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}
    >
      <style>{`
        @media (max-width: 700px) {
          [data-page-section] { padding: 1rem !important; }
          [data-page-section] h2 { font-size: 1rem !important; }
          [data-page-section] .btn-primary { width: 100%; }
        }
      `}</style>
      {msg ? (
        <p
          role="status"
          style={{
            margin: 0,
            fontSize: "0.82rem",
            fontWeight: 700,
            color: msg.includes("فشل") ? "#b91c1c" : "#166534",
          }}
        >
          {msg}
        </p>
      ) : null}
      {panels.map((sec) => {
        if (sec.kind === "kpis" || sec.kind === "table" || sec.kind === "actions") {
          return (
            <div
              key={sec.id}
              className="card-white"
              data-page-section={sec.id}
              data-section-kind={sec.kind}
              style={{ padding: "1rem 1.25rem", border: "1px dashed #cbd5e1" }}
            >
              <strong style={{ color: "#101D32" }}>{sec.title}</strong>
              <p style={{ margin: "0.35rem 0 0", color: "#64748b", fontSize: "0.8rem" }}>
                يُعرض هذا القسم ضمن تخطيط الصفحة الأصلي.
              </p>
            </div>
          );
        }

        const secFields = pageScopedFieldsForSection(fields, sec);
        const values = data[sec.id] ?? {};

        return (
          <section
            key={sec.id}
            className="card-white"
            data-page-section={sec.id}
            data-section-kind={sec.kind}
            data-testid={`page-section-${sec.id}`}
            style={{
              padding: "1.35rem 1.5rem",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              boxShadow: "0 8px 24px rgba(16,29,50,0.06)",
              background: "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 900,
                    color: "#101D32",
                  }}
                >
                  {sec.title}
                </h2>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                  ملاحظات عامة للصفحة (مشتركة) · تُحفظ في PostgreSQL مع إعدادات الصفحة — ليست لكل سجل على حدة
                </p>
              </div>
              {canWrite ? (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={savingId === sec.id}
                  onClick={() => void saveSection(sec.id)}
                  style={{ padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 800 }}
                >
                  {savingId === sec.id ? "جاري الحفظ…" : "حفظ محتوى القسم"}
                </button>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: "0.85rem" }}>
              {secFields.length === 0 ? (
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                    محتوى «{sec.title}»
                  </span>
                  <textarea
                    className="input-field"
                    rows={4}
                    disabled={!canWrite}
                    value={String(values.__body ?? "")}
                    placeholder={`اكتب محتوى قسم ${sec.title} هنا…`}
                    onChange={(e) => setField(sec.id, "__body", e.target.value)}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </label>
              ) : (
                secFields.map((f) => (
                  <label key={f.key} style={{ display: "grid", gap: "0.35rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                      {f.label}
                      {f.required ? " *" : ""}
                    </span>
                    {f.type === "textarea" ? (
                      <textarea
                        className="input-field"
                        rows={3}
                        disabled={!canWrite}
                        value={String(values[f.key] ?? "")}
                        onChange={(e) => setField(sec.id, f.key, e.target.value)}
                      />
                    ) : f.type === "select" ? (
                      <select
                        className="input-field"
                        disabled={!canWrite}
                        value={String(values[f.key] ?? "")}
                        onChange={(e) => setField(sec.id, f.key, e.target.value)}
                      >
                        <option value="">—</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        disabled={!canWrite}
                        checked={Boolean(values[f.key])}
                        onChange={(e) => setField(sec.id, f.key, e.target.checked)}
                      />
                    ) : (
                      <input
                        className="input-field"
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                        disabled={!canWrite}
                        value={String(values[f.key] ?? "")}
                        placeholder={f.placeholder}
                        onChange={(e) => setField(sec.id, f.key, e.target.value)}
                      />
                    )}
                  </label>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Helper: record-scoped custom fields (forms/tables) — exclude page-panel fields. */
export function recordScopedCustomFields(
  fields: CustomFieldDef[] | unknown[] | null | undefined,
  sections?: PageSectionDef[] | unknown[] | null
): CustomFieldDef[] {
  const list = asFields(fields);
  const secs = asSections(sections);
  const byId = new Map(secs.map((s) => [s.id, s]));
  return list.filter((f) => {
    if (!f.sectionId) return true;
    const sec = byId.get(f.sectionId);
    return fieldStorage(f, sec) === "record";
  });
}

export function recordScopedSections(
  sections?: PageSectionDef[] | unknown[] | null
): PageSectionDef[] {
  return asSections(sections).filter(
    (s) =>
      s.visible !== false &&
      (s.kind === "notes" || s.kind === "custom") &&
      sectionScope(s) === "record"
  );
}
