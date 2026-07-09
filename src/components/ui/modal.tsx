"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
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

function buildInitialForm(fields: FormField[], initial?: Record<string, unknown>) {
  const defaults: Record<string, unknown> = {};
  fields.forEach((field) => {
    defaults[field.key] = initial?.[field.key] ?? "";
  });
  return defaults;
}

export function Modal({ open, title, fields, initial, onSave, onClose, saveLabel = "حفظ" }: Props) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(() =>
    buildInitialForm(fields, initial)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    onSave(form);
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
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
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
          <h2 id={titleId} style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0a0a12" }}>{title}</h2>
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
            {fields.map((f, index) => (
              <div
                key={f.key}
                style={f.type === "textarea" ? { gridColumn: "1 / -1" } : {}}
              >
                <label className="input-label">{f.label}{f.required && <span style={{ color: "#c3152a" }}> *</span>}</label>
                {f.type === "select" ? (
                  <select
                    ref={(node) => {
                      if (index === 0) firstFieldRef.current = node;
                    }}
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
                    ref={(node) => {
                      if (index === 0) firstFieldRef.current = node;
                    }}
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
                    ref={(node) => {
                      if (index === 0) firstFieldRef.current = node;
                    }}
                    type={f.type}
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
