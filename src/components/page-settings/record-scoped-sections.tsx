"use client";

import { useEffect, useMemo, useState } from "react";
import type { CustomFieldDef, PageSectionDef } from "@/lib/page-settings/custom-field-types";
import { recordScopedSections } from "@/components/page-settings/page-dynamic-sections";

type Row = Record<string, unknown> & { id?: string };

type Props = {
  sections?: PageSectionDef[] | unknown[] | null;
  customFields?: CustomFieldDef[] | unknown[] | null;
  rows: Row[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  canWrite: boolean;
  entityName: string;
  apiEndpoint: string | null;
  onSavedRow?: (id: string, patch: Record<string, unknown>) => void;
};

function asFields(raw: unknown): CustomFieldDef[] {
  if (!Array.isArray(raw)) return [];
  return (raw as CustomFieldDef[]).filter((f) => f && f.key && f.visible !== false);
}

/** Per-record No-Code sections — values isolated by row id in PostgreSQL. */
export function RecordScopedSectionsPanel({
  sections,
  customFields,
  rows,
  selectedId,
  onSelectId,
  canWrite,
  entityName,
  apiEndpoint,
  onSavedRow,
}: Props) {
  const recordSections = useMemo(() => recordScopedSections(sections), [sections]);
  const fields = useMemo(() => asFields(customFields), [customFields]);
  const selected = rows.find((r) => String(r.id) === String(selectedId)) ?? null;
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      setDraft({});
      return;
    }
    const next: Record<string, unknown> = {};
    for (const sec of recordSections) {
      for (const f of fields.filter((x) => x.sectionId === sec.id)) {
        next[f.key] = selected[f.key] ?? "";
      }
    }
    setDraft(next);
    setMsg(null);
  }, [selected, recordSections, fields]);

  if (recordSections.length === 0) return null;

  const labelFor = (row: Row) => {
    const keys = ["caseNo", "name", "title", "client", "clientName", "ref", "id"];
    for (const k of keys) {
      if (row[k] != null && String(row[k]).trim()) return String(row[k]);
    }
    return String(row.id ?? "—");
  };

  const save = async () => {
    if (!selected?.id || !apiEndpoint || !canWrite) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiEndpoint}/${selected.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "فشل حفظ ملاحظات السجل");
      onSavedRow?.(String(selected.id), draft);
      setMsg("تم حفظ ملاحظات هذا السجل فقط (معزولة عن بقية السجلات)");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}
      data-record-sections="1"
    >
      {recordSections.map((sec) => {
        const effectiveFields = fields.filter((f) => f.sectionId === sec.id);

        return (
          <section
            key={sec.id}
            className="card-white"
            data-page-section={sec.id}
            data-section-scope="record"
            data-testid={`record-section-${sec.id}`}
            style={{
              padding: "1.25rem 1.4rem",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(180deg,#fff 0%,#f8fafc 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.85rem",
              }}
            >
              <div style={{ minWidth: 180, flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "#101D32" }}>
                  {sec.title}
                </h2>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.76rem", color: "#64748b" }}>
                  ملاحظات لكل {entityName} على حدة · لا تُشارك بين السجلات · PostgreSQL
                </p>
              </div>
              <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
                اختر {entityName}
                <select
                  className="input-field"
                  value={selectedId ?? ""}
                  onChange={(e) => onSelectId(e.target.value || null)}
                  style={{ minWidth: 200 }}
                  data-testid={`record-section-select-${sec.id}`}
                >
                  <option value="">— اختر —</option>
                  {rows.map((r) => (
                    <option key={String(r.id)} value={String(r.id)}>
                      {labelFor(r)}
                    </option>
                  ))}
                </select>
              </label>
              {canWrite && selectedId ? (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={() => void save()}
                  style={{ padding: "0.55rem 1.1rem", fontWeight: 800, fontSize: "0.82rem" }}
                >
                  {saving ? "جاري الحفظ…" : "حفظ ملاحظات السجل"}
                </button>
              ) : null}
            </div>

            {!selectedId ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
                اختر {entityName} من القائمة لعرض أو تعديل ملاحظاته الخاصة.
              </p>
            ) : effectiveFields.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
                أضف حقولًا لهذا القسم من إعدادات الصفحة ثم اربطها به.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {effectiveFields.map((f) => (
                  <label key={f.key} style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                      {f.label}
                    </span>
                    {f.type === "textarea" ? (
                      <textarea
                        className="input-field"
                        rows={3}
                        disabled={!canWrite}
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                        data-testid={`record-field-${f.key}`}
                      />
                    ) : f.type === "select" ? (
                      <select
                        className="input-field"
                        disabled={!canWrite}
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
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
                        checked={Boolean(draft[f.key])}
                        onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.checked }))}
                      />
                    ) : (
                      <input
                        className="input-field"
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                        disabled={!canWrite}
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                        data-testid={`record-field-${f.key}`}
                      />
                    )}
                  </label>
                ))}
              </div>
            )}
            {msg ? (
              <p
                role="status"
                style={{
                  margin: "0.75rem 0 0",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: msg.includes("فشل") ? "#b91c1c" : "#166534",
                }}
              >
                {msg}
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
