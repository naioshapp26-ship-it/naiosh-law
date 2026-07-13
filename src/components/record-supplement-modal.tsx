"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import type { FileAttachment } from "@/lib/file-upload";

type Props = {
  open: boolean;
  recordRef: string;
  recordTitle: string;
  onSave: (data: { notes: string; attachments: FileAttachment[] }) => void | Promise<void>;
  onClose: () => void;
};

export function RecordSupplementModal({ open, recordRef, recordTitle, onSave, onClose }: Props) {
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setNotes("");
      setAttachments([]);
      setError("");
    }
  }, [open, recordRef]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && attachments.length === 0) {
      setError("أضف ملاحظة أو مرفقاً واحداً على الأقل");
      return;
    }
    setSaving(true);
    try {
      await onSave({ notes: notes.trim(), attachments });
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
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>➕ إضافة معلومات للمرجع</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        <div style={{ background: "#f8f9fb", borderRadius: "12px", padding: "1rem", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>المرجع</p>
          <p style={{ fontWeight: 800, color: "#c3152a", fontSize: "0.9rem" }}>{recordRef}</p>
          <p style={{ fontSize: "0.85rem", color: "#0a0a12", marginTop: "0.35rem" }}>{recordTitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label className="input-label">معلومات / ملاحظات إضافية</label>
              <textarea
                className="input-field"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف تفاصيل، مراجع، أو ملاحظات تخص هذا المرجع..."
              />
            </div>
            <FileUploadField value={attachments} onChange={setAttachments} />
            {error && <p style={{ color: "#c3152a", fontSize: "0.78rem" }}>{error}</p>}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="btn-ghost-dark" style={{ padding: "0.75rem 1.5rem" }}>
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: "0.75rem 2rem", opacity: saving ? 0.7 : 1 }}>
              {saving ? "جاري الحفظ..." : "حفظ الإضافة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
