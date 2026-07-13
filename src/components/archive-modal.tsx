"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ArchiveAttachment } from "@/lib/archive-types";
import { ACCEPTED_FILE_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/archive-types";

type Props = {
  open: boolean;
  title: string;
  initial?: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string;
    notes?: string;
    sourceModuleLabel?: string;
    attachments?: ArchiveAttachment[];
  };
  onSave: (data: {
    title: string;
    description: string;
    category: string;
    tags: string;
    notes: string;
    attachments: ArchiveAttachment[];
  }) => void | Promise<void>;
  onClose: () => void;
  saveLabel?: string;
};

async function readFile(file: File): Promise<ArchiveAttachment | null> {
  if (file.size > MAX_ATTACHMENT_BYTES) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        fileData: String(reader.result ?? ""),
        size: file.size,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function ArchiveModal({ open, title, initial, onSave, onClose, saveLabel = "حفظ" }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    notes: "",
  });
  const [attachments, setAttachments] = useState<ArchiveAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        category: initial?.category ?? initial?.sourceModuleLabel ?? "",
        tags: initial?.tags ?? "",
        notes: initial?.notes ?? "",
      });
      setAttachments(initial?.attachments ?? []);
      setFileError("");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setFileError("");
    const next = [...attachments];
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setFileError(`الملف ${file.name} أكبر من 3 ميجابايت`);
        continue;
      }
      const parsed = await readFile(file);
      if (parsed) next.push(parsed);
    }
    setAttachments(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, attachments });
    } finally {
      setSaving(false);
    }
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
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0a0a12" }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label className="input-label">العنوان <span style={{ color: "#c3152a" }}>*</span></label>
              <input
                className="input-field"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">التصنيف / النظام</label>
              <input
                className="input-field"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">الوصف</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">الوسوم</label>
              <input
                className="input-field"
                placeholder="مثال: عقود، 2026، تجاري"
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">ملاحظات</label>
              <textarea
                className="input-field"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>

            <div>
              <label className="input-label">المرفقات (PDF، Excel، Word، صور)</label>
              <input
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES}
                className="input-field"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {fileError && <p style={{ color: "#c3152a", fontSize: "0.78rem", marginTop: "0.35rem" }}>{fileError}</p>}
              {attachments.length > 0 && (
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {attachments.map((a, i) => (
                    <div
                      key={`${a.name}-${i}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.55rem 0.75rem",
                        background: "#f8f9fb",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>📎 {a.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ background: "none", border: "none", color: "#c3152a", cursor: "pointer", fontSize: "0.75rem" }}
                      >
                        إزالة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="btn-ghost-dark" style={{ padding: "0.75rem 1.5rem" }}>
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: "0.75rem 2rem", opacity: saving ? 0.7 : 1 }}>
              {saving ? "جاري الحفظ..." : saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
