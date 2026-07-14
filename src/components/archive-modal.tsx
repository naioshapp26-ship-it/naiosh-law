"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import type { FileAttachment } from "@/lib/file-upload";
import { emptyPartyFields, type PartyFields } from "@/lib/party-fields";

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
    attachments?: FileAttachment[];
    firstParty?: string;
    firstPartyPhone?: string;
    secondParty?: string;
    secondPartyPhone?: string;
  };
  onSave: (data: {
    title: string;
    description: string;
    category: string;
    tags: string;
    notes: string;
    attachments: FileAttachment[];
    firstParty: string;
    firstPartyPhone: string;
    secondParty: string;
    secondPartyPhone: string;
  }) => void | Promise<void>;
  onClose: () => void;
  saveLabel?: string;
};

export function ArchiveModal({ open, title, initial, onSave, onClose, saveLabel = "حفظ" }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    notes: "",
  });
  const [parties, setParties] = useState<PartyFields>(emptyPartyFields());
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        category: initial?.category ?? initial?.sourceModuleLabel ?? "",
        tags: initial?.tags ?? "",
        notes: initial?.notes ?? "",
      });
      setParties({
        firstParty: initial?.firstParty ?? "",
        firstPartyPhone: initial?.firstPartyPhone ?? "",
        secondParty: initial?.secondParty ?? "",
        secondPartyPhone: initial?.secondPartyPhone ?? "",
      });
      setAttachments(initial?.attachments ?? []);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, attachments, ...parties });
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
              <input className="input-field" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">التصنيف / النظام</label>
              <input className="input-field" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              <div>
                <label className="input-label">طرف أول <span style={{ color: "#c3152a" }}>*</span></label>
                <input className="input-field" required value={parties.firstParty} onChange={(e) => setParties((p) => ({ ...p, firstParty: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">رقم جوال الطرف الأول <span style={{ color: "#c3152a" }}>*</span></label>
                <input className="input-field" type="tel" required value={parties.firstPartyPhone} onChange={(e) => setParties((p) => ({ ...p, firstPartyPhone: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">طرف ثاني <span style={{ color: "#c3152a" }}>*</span></label>
                <input className="input-field" required value={parties.secondParty} onChange={(e) => setParties((p) => ({ ...p, secondParty: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">رقم جوال الطرف الثاني <span style={{ color: "#c3152a" }}>*</span></label>
                <input className="input-field" type="tel" required value={parties.secondPartyPhone} onChange={(e) => setParties((p) => ({ ...p, secondPartyPhone: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="input-label">الوصف</label>
              <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">الوسوم</label>
              <input className="input-field" placeholder="مثال: عقود، 2026، تجاري" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">ملاحظات</label>
              <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <FileUploadField value={attachments} onChange={setAttachments} />
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
