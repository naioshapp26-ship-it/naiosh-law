"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { FormField } from "@/data/module-configs";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { parseAttachments, type FileAttachment } from "@/lib/file-upload";
import { PARTY_FORM_FIELDS, PARTY_FIELD_KEYS } from "@/lib/party-fields";

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
};

export function Modal({
  open,
  title,
  fields,
  initial,
  onSave,
  onClose,
  saveLabel = "حفظ",
  enableFiles = true,
  enableParties = true,
}: Props) {
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [saving, setSaving] = useState(false);

  const hasExplicitFilesField = fields.some((f) => f.type === "files");
  const hasExplicitPartyFields = PARTY_FIELD_KEYS.some((key) => fields.some((f) => f.key === key));

  const effectiveFields = useMemo(() => {
    if (!enableParties || hasExplicitPartyFields) return fields;
    const insertAt = Math.max(
      0,
      fields.findIndex((f) => f.type === "textarea" || f.key === "description" || f.key === "notes")
    );
    const at = insertAt === -1 ? fields.length : insertAt;
    return [...fields.slice(0, at), ...PARTY_FORM_FIELDS, ...fields.slice(at)];
  }, [fields, enableParties, hasExplicitPartyFields]);

  useEffect(() => {
    if (open) {
      const defaults: Record<string, unknown> = {};
      effectiveFields.forEach((f) => {
        if (f.type === "files") {
          defaults[f.key] = parseAttachments(initial?.[f.key]);
        } else {
          defaults[f.key] = initial?.[f.key] ?? "";
        }
      });
      for (const key of PARTY_FIELD_KEYS) {
        if (defaults[key] === undefined) defaults[key] = initial?.[key] ?? "";
      }
      setForm(defaults);
      if (enableFiles && !hasExplicitFilesField) {
        setAttachments(parseAttachments(initial?.attachments));
      } else {
        setAttachments([]);
      }
    }
  }, [open, initial, effectiveFields, enableFiles, hasExplicitFilesField]);

  if (!open) return null;

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

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
          maxWidth: 600,
          maxHeight: "90vh",
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
            marginBottom: "1.75rem",
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

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1rem",
            }}
            className="modal-form-grid"
          >
            {effectiveFields.map((f) => (
              <div
                key={f.key}
                style={f.type === "textarea" || f.type === "files" ? { gridColumn: "1 / -1" } : {}}
              >
                {f.type === "files" ? (
                  <FileUploadField
                    label={f.label}
                    value={parseAttachments(form[f.key])}
                    onChange={(files) => set(f.key, files)}
                  />
                ) : (
                  <>
                    <label className="input-label">
                      {f.label}
                      {f.required && <span style={{ color: "#c3152a" }}> *</span>}
                    </label>
                    {f.type === "select" ? (
                      <select
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
                        value={String(form[f.key] ?? "")}
                        onChange={(e) => set(f.key, e.target.value)}
                        required={f.required}
                        rows={3}
                        className="input-field"
                        style={{ resize: "vertical", minHeight: 80 }}
                        placeholder={f.placeholder}
                      />
                    ) : (
                      <input
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
                        required={f.required}
                        className="input-field"
                        placeholder={f.placeholder}
                      />
                    )}
                  </>
                )}
              </div>
            ))}

            {enableFiles && !hasExplicitFilesField && (
              <div style={{ gridColumn: "1 / -1" }}>
                <FileUploadField
                  label="المرفقات من الكمبيوتر (ملف شاهد · صورة · فيديو)"
                  hint="مهم لقضايا التأمين والحوادث: ارفع الشواهد والصور ومقاطع الفيديو مباشرة من سطح المكتب"
                  value={attachments}
                  onChange={setAttachments}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem", justifyContent: "flex-end" }}>
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
        @media (max-width: 600px) { .modal-form-grid { grid-template-columns: 1fr !important; } }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
