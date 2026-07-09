"use client";

import { FormEvent, useState } from "react";
import type { FormField } from "@/data/module-configs";

type Props = {
  open: boolean;
  title: string;
  fields: FormField[];
  initial?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  saveLabel?: string;
};

function getInitialForm(fields: FormField[], initial?: Record<string, unknown>) {
  const defaults: Record<string, unknown> = {};
  fields.forEach((field) => {
    defaults[field.key] = initial?.[field.key] ?? "";
  });
  return defaults;
}

function getFormKey(fields: FormField[], initial?: Record<string, unknown>) {
  return fields.map((field) => `${field.key}:${String(initial?.[field.key] ?? "")}`).join("|");
}

export function Modal(props: Props) {
  const { open, fields, initial, title } = props;
  if (!open) return null;

  return <ModalContent key={`${title}:${getFormKey(fields, initial)}`} {...props} />;
}

function ModalContent({ title, fields, initial, onSave, onClose, saveLabel = "حفظ" }: Omit<Props, "open">) {
  const [form, setForm] = useState<Record<string, unknown>>(() => getInitialForm(fields, initial));
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    onSave(form);
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
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          animation: "fade-in-up 0.22s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1rem",
            }}
            className="modal-form-grid"
          >
            {fields.map((f) => (
              <div
                key={f.key}
                style={f.type === "textarea" ? { gridColumn: "1 / -1" } : {}}
              >
                <label className="input-label">{f.label}{f.required && <span style={{ color: "#c3152a" }}> *</span>}</label>
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
                      <option key={o} value={o}>{o}</option>
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
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={String(form[f.key] ?? "")}
                    onChange={(e) => set(f.key, e.target.value)}
                    required={f.required}
                    className="input-field"
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
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
