"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { FormField } from "@/data/module-configs";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { parseAttachments, type FileAttachment } from "@/lib/file-upload";
import { PARTY_FORM_FIELDS, PARTY_FIELD_KEYS } from "@/lib/party-fields";
import { assertFieldLabel, sanitizeFormFields } from "@/lib/form-field-labels";
import {
  citiesForCountry,
  dialCodeForCountry,
  PERSON_NAME_FIELD_KEYS,
  PERSON_CONTACT_FIELD_KEYS,
} from "@/lib/person-contact";

type ClientLookup = {
  id: string;
  name: string;
  clientId: string;
  phone: string;
  phoneDialCode: string;
  phoneSecondary: string;
  phoneSecondaryDialCode: string;
  country: string;
  city: string;
  contactIncomplete: boolean;
};

type Props = {
  open: boolean;
  title: string;
  fields: FormField[];
  initial?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  saveLabel?: string;
  enableFiles?: boolean;
  enableParties?: boolean;
  filesLabel?: string;
  filesHint?: string;
  filesMode?: "all" | "media";
};

const CONTACT_KEYS = new Set<string>(PERSON_CONTACT_FIELD_KEYS as readonly string[]);
const NAME_KEYS = new Set<string>(PERSON_NAME_FIELD_KEYS as readonly string[]);

function normalizeDialForSelect(raw: string, country?: string): string {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  if (v.includes("(")) return v;
  if (v.startsWith("+")) {
    const c = country || "";
    return c ? `${v} (${c})` : v;
  }
  return v;
}

export function Modal({
  open,
  title,
  fields,
  initial,
  onSave,
  onClose,
  saveLabel = "حفظ",
  enableFiles = true,
  enableParties = false,
  filesLabel,
  filesHint,
  filesMode = "all",
}: Props) {
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [lookupHits, setLookupHits] = useState<ClientLookup[]>([]);
  const [autofilledFrom, setAutofilledFrom] = useState<string | null>(null);
  const [centralEditNotice, setCentralEditNotice] = useState(false);
  const [caseOptions, setCaseOptions] = useState<
    Array<{ id: string; caseNo: string; client: string }>
  >([]);

  const hasExplicitFilesField = fields.some((f) => f.type === "files");
  const hasExplicitPartyFields = PARTY_FIELD_KEYS.some((key) => fields.some((f) => f.key === key));
  const hasContactFields = fields.some((f) => CONTACT_KEYS.has(f.key));
  const hasCaseSelect = fields.some((f) => f.type === "case-select" || f.key === "caseNo");
  const personNameKey = fields.find((f) => NAME_KEYS.has(f.key))?.key ?? null;

  const effectiveFields = useMemo(() => {
    const labeled = sanitizeFormFields(fields);
    if (!enableParties || hasExplicitPartyFields) return labeled;
    const insertAt = Math.max(
      0,
      labeled.findIndex((f) => f.type === "textarea" || f.key === "description" || f.key === "notes")
    );
    const at = insertAt === -1 ? labeled.length : insertAt;
    return sanitizeFormFields([...labeled.slice(0, at), ...PARTY_FORM_FIELDS, ...labeled.slice(at)]);
  }, [fields, enableParties, hasExplicitPartyFields]);

  useEffect(() => {
    if (!open || !hasCaseSelect) {
      setCaseOptions([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/cases", { credentials: "include" });
        if (!res.ok) return;
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        if (cancelled) return;
        setCaseOptions(
          rows
            .map((r) => ({
              id: String(r.id ?? ""),
              caseNo: String(r.caseNo ?? ""),
              client: String(r.client ?? r.clientName ?? ""),
            }))
            .filter((r) => r.id && r.caseNo)
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, hasCaseSelect]);

  useEffect(() => {
    if (open) {
      const blankPlaceholder = (v: unknown) => {
        const s = String(v ?? "").trim();
        if (!s || s === "—" || s === "غير مسجل" || s === "••••••••" || s === "لا توجد قضية مرتبطة") return "";
        return s;
      };
      const defaults: Record<string, unknown> = {};
      effectiveFields.forEach((f) => {
        if (f.type === "files") {
          defaults[f.key] = parseAttachments(initial?.[f.key]);
        } else {
          const raw = initial?.[f.key] ?? "";
          // Display placeholders must not enter typed inputs (email/tel validation)
          if (f.type === "email" || f.type === "tel" || f.type === "number") {
            defaults[f.key] = blankPlaceholder(raw);
          } else if (CONTACT_KEYS.has(f.key) || NAME_KEYS.has(f.key)) {
            defaults[f.key] = blankPlaceholder(raw) || raw || "";
          } else {
            defaults[f.key] = blankPlaceholder(raw) === "" && String(raw).trim() === "—" ? "" : (raw ?? "");
          }
        }
      });
      for (const key of PARTY_FIELD_KEYS) {
        if (defaults[key] === undefined) defaults[key] = blankPlaceholder(initial?.[key]) || "";
      }
      // Normalize dial codes for select options
      if (defaults.phoneDialCode) {
        defaults.phoneDialCode = normalizeDialForSelect(
          String(defaults.phoneDialCode),
          String(defaults.country || "")
        );
      }
      if (defaults.phoneSecondaryDialCode) {
        defaults.phoneSecondaryDialCode = normalizeDialForSelect(
          String(defaults.phoneSecondaryDialCode),
          String(defaults.country || "")
        );
      }
      // If phone is "+20 100..." strip dial for the tel field
      if (typeof defaults.phone === "string" && defaults.phone.startsWith("+")) {
        const parts = defaults.phone.split(/\s+/);
        if (parts.length >= 2 && !defaults.phoneDialCode) {
          defaults.phoneDialCode = normalizeDialForSelect(parts[0]!, String(defaults.country || ""));
          defaults.phone = parts.slice(1).join(" ");
        } else if (parts.length >= 2) {
          defaults.phone = parts.slice(1).join(" ");
        }
      }
      // Country/city display placeholders → empty so select/required behave correctly
      if (defaults.country === "غير مسجل" || defaults.country === "—") defaults.country = "";
      if (defaults.city === "غير مسجل" || defaults.city === "—") defaults.city = "";
      if (initial?.clientId) defaults.clientId = initial.clientId;
      setForm(defaults);
      setAutofilledFrom(null);
      setCentralEditNotice(Boolean(initial?.clientId || initial?.phone || initial?.country));
      setLookupHits([]);
      if (enableFiles && !hasExplicitFilesField) {
        setAttachments(parseAttachments(initial?.attachments));
      } else {
        setAttachments([]);
      }
    }
  }, [open, initial, effectiveFields, enableFiles, hasExplicitFilesField]);

  const applyClientLookup = useCallback((hit: ClientLookup) => {
    setForm((prev) => ({
      ...prev,
      clientId: hit.clientId,
      ...(personNameKey ? { [personNameKey]: hit.name } : {}),
      phone: hit.phone || prev.phone || "",
      phoneDialCode:
        normalizeDialForSelect(hit.phoneDialCode, hit.country) || prev.phoneDialCode || "",
      phoneSecondary: hit.phoneSecondary || "",
      phoneSecondaryDialCode: normalizeDialForSelect(hit.phoneSecondaryDialCode, hit.country) || "",
      country: hit.country || prev.country || "",
      city: hit.city || prev.city || "",
    }));
    setAutofilledFrom(hit.name);
    setCentralEditNotice(true);
    setLookupHits([]);
  }, [personNameKey]);

  const lookupClientByName = useCallback(
    async (name: string, exact = false) => {
      const q = name.trim();
      if (q.length < 2) {
        setLookupHits([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/clients/lookup?q=${encodeURIComponent(q)}${exact ? "&exact=1" : ""}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as ClientLookup[];
        if (exact && data[0]) {
          applyClientLookup(data[0]);
        } else {
          setLookupHits(Array.isArray(data) ? data : []);
        }
      } catch {
        /* ignore lookup errors */
      }
    },
    [applyClientLookup]
  );

  if (!open) return null;

  const set = (key: string, value: unknown) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (
        key === "country" ||
        key.endsWith("Country") ||
        key === "firstPartyCountry" ||
        key === "secondPartyCountry"
      ) {
        const country = String(value ?? "");
        if (key === "country" && !prev.phoneDialCode) {
          next.phoneDialCode = `${dialCodeForCountry(country)} (${country})`;
        }
        if (key === "firstPartyCountry" && !prev.firstPartyDialCode) {
          next.firstPartyDialCode = `${dialCodeForCountry(country)} (${country})`;
        }
        if (key === "secondPartyCountry" && !prev.secondPartyDialCode) {
          next.secondPartyDialCode = `${dialCodeForCountry(country)} (${country})`;
        }
      }
      if (CONTACT_KEYS.has(key) && (prev.clientId || autofilledFrom)) {
        setCentralEditNotice(true);
      }
      return next;
    });
    if (personNameKey && key === personNameKey) {
      void lookupClientByName(String(value ?? ""), false);
    }
  };

  const citySuggestionsFor = (field: FormField): string[] => {
    if (!field.dependsOn) return [];
    const parentVal = String(form[field.dependsOn] ?? "");
    return citiesForCountry(parentVal);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const payload = { ...form };
    if (enableFiles && !hasExplicitFilesField) {
      payload.attachments = attachments;
    }
    onSave(payload);
    setSaving(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10,10,18,0.55)",
        backdropFilter: "blur(5px)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "2rem",
          width: "100%",
          maxWidth: hasContactFields ? 720 : 600,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          animation: "fade-in-up 0.22s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h2 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0a0a12" }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: "9px",
              border: "1px solid #e2e8f0",
              background: "#f8f9fb",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            ✕
          </button>
        </div>

        {hasContactFields && centralEditNotice && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 12,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e3a8a",
              fontSize: "0.8rem",
              fontWeight: 600,
              lineHeight: 1.55,
            }}
          >
            {autofilledFrom
              ? `تم تعبئة بيانات الاتصال من السجل المركزي للشخص «${autofilledFrom}». أي تعديل هنا يحدّث المصدر المركزي وينعكس على الصفحات المرتبطة، ويُسجَّل في سجل التدقيق.`
              : "حقول الاتصال مرتبطة بالسجل المركزي للشخص. التعديل المقصود يُحفظ مركزيًا ويُسجَّل في سجل التدقيق — اترك الحقل فارغًا فقط إذا كانت القيمة غير مسجّلة."}
          </div>
        )}

        {lookupHits.length > 0 && personNameKey && (
          <div
            style={{
              marginBottom: "1rem",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
              background: "#f8fafc",
            }}
          >
            <p style={{ padding: "0.55rem 0.85rem", fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>
              أشخاص مطابقون — اختر للتعبئة التلقائية من المصدر المركزي
            </p>
            {lookupHits.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => applyClientLookup(h)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "right",
                  padding: "0.65rem 0.85rem",
                  border: "none",
                  borderTop: "1px solid #e2e8f0",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-cairo)",
                  fontSize: "0.85rem",
                  color: "#0a0a12",
                }}
              >
                <strong>{h.name}</strong>
                <span style={{ color: "#64748b", marginInlineStart: 8, fontSize: "0.78rem" }}>
                  {h.phone || "غير مسجل"} · {h.country || "غير مسجل"} / {h.city || "غير مسجل"}
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1rem 1.15rem",
            }}
            className="modal-form-grid"
          >
            {effectiveFields.map((f) => {
              const fieldLabel = assertFieldLabel(f);
              const inputId = `modal-field-${f.key}`;
              const isContact = CONTACT_KEYS.has(f.key);
              const isName = NAME_KEYS.has(f.key);
              return (
                <div
                  key={f.key}
                  style={
                    f.type === "textarea" || f.type === "files"
                      ? { gridColumn: "1 / -1" }
                      : isName
                        ? { gridColumn: "1 / -1" }
                        : undefined
                  }
                >
                  {f.type === "files" ? (
                    <FileUploadField
                      label={fieldLabel}
                      value={parseAttachments(form[f.key])}
                      onChange={(files) => set(f.key, files)}
                      mode={filesMode}
                    />
                  ) : (
                    <>
                      <label className="input-label" htmlFor={inputId}>
                        {fieldLabel}
                        {f.required && <span style={{ color: "#101D32" }}> *</span>}
                        {isContact && !f.required && (
                          <span style={{ color: "#94a3b8", fontWeight: 600 }}> (اختياري)</span>
                        )}
                      </label>
                      {f.type === "case-select" ? (
                        <select
                          id={inputId}
                          value={String(form.caseId ?? "")}
                          onChange={(e) => {
                            const id = e.target.value;
                            const hit = caseOptions.find((c) => c.id === id);
                            setForm((prev) => ({
                              ...prev,
                              caseId: id || "",
                              caseNo: hit?.caseNo ?? "",
                              ...(hit?.client && !String(prev.client ?? "").trim()
                                ? { client: hit.client }
                                : {}),
                            }));
                          }}
                          required={f.required}
                          disabled={f.readOnly || Boolean(form.id && f.readOnly)}
                          className="input-field"
                          style={{ cursor: "pointer" }}
                        >
                          <option value="">
                            {f.required ? "اختر قضية من السجل المركزي..." : "بدون قضية مرتبطة"}
                          </option>
                          {caseOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.caseNo}
                              {c.client ? ` — ${c.client}` : ""}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "select" ? (
                        <select
                          id={inputId}
                          value={String(form[f.key] ?? "")}
                          onChange={(e) => set(f.key, e.target.value)}
                          required={f.required}
                          className="input-field"
                          style={{ cursor: "pointer" }}
                        >
                          <option value="">اختر...</option>
                          {f.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea
                          id={inputId}
                          value={String(form[f.key] ?? "")}
                          onChange={(e) => set(f.key, e.target.value)}
                          required={f.required}
                          rows={3}
                          className="input-field"
                          style={{ resize: "vertical", minHeight: 80 }}
                          placeholder={f.placeholder}
                        />
                      ) : f.dependsOn ? (
                        <>
                          <input
                            id={inputId}
                            type="text"
                            list={`datalist-${f.key}`}
                            value={String(form[f.key] ?? "")}
                            onChange={(e) => set(f.key, e.target.value)}
                            required={f.required}
                            className="input-field"
                            placeholder={f.placeholder ?? "اختر أو اكتب مدينة"}
                            autoComplete="off"
                          />
                          <datalist id={`datalist-${f.key}`}>
                            {citySuggestionsFor(f).map((city) => (
                              <option key={city} value={city} />
                            ))}
                          </datalist>
                        </>
                      ) : (
                        <input
                          id={inputId}
                          type={
                            f.type === "number"
                              ? "number"
                              : f.type === "date"
                                ? "date"
                                : f.type === "tel"
                                  ? "tel"
                                  : f.type === "email"
                                    ? "email"
                                    : "text"
                          }
                          value={String(form[f.key] ?? "")}
                          onChange={(e) => set(f.key, e.target.value)}
                          onBlur={() => {
                            if (isName) {
                              void lookupClientByName(String(form[f.key] ?? ""), true);
                            }
                          }}
                          required={f.required}
                          readOnly={Boolean(f.readOnly && (f.key !== "caseNo" || form.id))}
                          className="input-field"
                          placeholder={f.placeholder}
                          autoComplete={isName ? "off" : undefined}
                          style={
                            f.readOnly && form.id && f.key === "caseNo"
                              ? { background: "#f8fafc", color: "#334155", fontWeight: 700 }
                              : undefined
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {enableFiles && !hasExplicitFilesField && (
              <div style={{ gridColumn: "1 / -1" }}>
                <FileUploadField
                  label={
                    filesLabel ??
                    (filesMode === "media"
                      ? "صورة أو فيديو المقالة (رفع مباشر أو رابط)"
                      : "المرفقات من الكمبيوتر (ملف شاهد · صورة · فيديو)")
                  }
                  hint={
                    filesHint ??
                    (filesMode === "media"
                      ? "معظم المقالات تتضمن صورة أو فيديو — ارفع من الجهاز أو الصق رابطًا مباشرًا"
                      : "مهم لقضايا التأمين والحوادث: ارفع الشواهد والصور ومقاطع الفيديو مباشرة من سطح المكتب")
                  }
                  value={attachments}
                  onChange={setAttachments}
                  mode={filesMode}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#f8f9fb",
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#475569",
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: "0.75rem 2rem", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "جاري الحفظ..." : saveLabel}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 640px) { .modal-form-grid { grid-template-columns: 1fr !important; } }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
