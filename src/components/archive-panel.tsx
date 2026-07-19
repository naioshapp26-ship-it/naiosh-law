"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArchiveModal } from "@/components/archive-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader, PageStats, BtnPrimary, PageLoader, useToast } from "@/components/domain-page";
import { useSession, canWriteRole } from "@/lib/session";
import type { ArchiveRecordDto } from "@/lib/archive-types";
import { MODULE_LABELS } from "@/lib/archive-types";
import { upsertRecordParties } from "@/lib/record-parties-client";
import { formatDate } from "@/lib/format";

const th: React.CSSProperties = {
  textAlign: "right",
  padding: "0.75rem 1rem",
  fontSize: "0.78rem",
  color: "#64748b",
  fontWeight: 700,
  borderBottom: "2px solid #e2e8f0",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontSize: "0.82rem",
  color: "#0a0a12",
  borderBottom: "1px solid #f1f5f9",
};
const actionBtn: React.CSSProperties = {
  padding: "0.35rem 0.65rem",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#fff",
  cursor: "pointer",
  fontFamily: "var(--font-cairo)",
  fontSize: "0.72rem",
  fontWeight: 700,
};

export function ArchivePanel() {
  const { user, ready } = useSession(true);
  const { show, Toast } = useToast();
  const [rows, setRows] = useState<ArchiveRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ArchiveRecordDto | null>(null);
  const [viewTarget, setViewTarget] = useState<ArchiveRecordDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArchiveRecordDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState("");

  const canWrite = user ? canWriteRole(user.role) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (moduleFilter) params.set("sourceModule", moduleFilter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/archive?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "تعذر تحميل الأرشيف");
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setRows([]);
      const message = err instanceof Error ? err.message : "تعذر تحميل الأرشيف";
      setLoadError(message);
      show("error", message);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, search, show]);

  useEffect(() => {
    if (!ready || !user) return;
    const timer = setTimeout(() => {
      void load();
    }, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [ready, user, load, search]);

  const stats = useMemo(
    () => [
      { label: "إجمالي المؤرشف", value: String(rows.length), icon: "📦" },
      { label: "أنظمة", value: String(new Set(rows.map((r) => r.sourceModule)).size), icon: "🗂️" },
      { label: "بمرفقات", value: String(rows.filter((r) => r.attachments.length > 0).length), icon: "📎" },
      { label: "هذا العام", value: String(rows.filter((r) => r.refNo.includes(String(new Date().getFullYear()))).length), icon: "📅" },
    ],
    [rows]
  );

  const moduleOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.sourceModule));
    return Array.from(set);
  }, [rows]);

  const handleSave = async (data: {
    title: string;
    description: string;
    category: string;
    tags: string;
    notes: string;
    attachments: ArchiveRecordDto["attachments"];
    firstParty: string;
    firstPartyPhone: string;
    secondParty: string;
    secondPartyPhone: string;
  }) => {
    try {
      const payload = {
        ...data,
        notes: [
          data.notes,
          data.firstParty ? `طرف أول: ${data.firstParty} (${data.firstPartyPhone})` : "",
          data.secondParty ? `طرف ثاني: ${data.secondParty} (${data.secondPartyPhone})` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };
      if (editTarget) {
        const res = await fetch(`/api/archive/${editTarget.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        show("success", "✅ تم تحديث السجل المؤرشف");
        await upsertRecordParties({
          sourceModule: "archive",
          sourceId: editTarget.id,
          sourceRef: editTarget.refNo,
          parties: {
            firstParty: data.firstParty,
            firstPartyPhone: data.firstPartyPhone,
            secondParty: data.secondParty,
            secondPartyPhone: data.secondPartyPhone,
          },
        });
      } else {
        const res = await fetch("/api/archive", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            sourceModule: "manual",
            sourceModuleLabel: data.category || "إضافة يدوية",
          }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        if (created?.id) {
          await upsertRecordParties({
            sourceModule: "archive",
            sourceId: String(created.id),
            sourceRef: created.refNo,
            parties: {
              firstParty: data.firstParty,
              firstPartyPhone: data.firstPartyPhone,
              secondParty: data.secondParty,
              secondPartyPhone: data.secondPartyPhone,
            },
          });
        }
        show("success", "✅ تمت إضافة السجل للأرشيف");
      }
      setModalOpen(false);
      setEditTarget(null);
      await load();
    } catch {
      show("error", "فشل حفظ السجل");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/archive/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      show("success", "🗑️ تم حذف السجل من الأرشيف");
      setDeleteTarget(null);
      await load();
    } catch {
      show("error", "فشل الحذف");
    } finally {
      setDeleting(false);
    }
  };

  if (!ready) return <PageLoader />;
  if (!user) return <PageLoader label="جاري التحويل لتسجيل الدخول..." />;

  return (
    <AppShell>
      {Toast}
      <div style={{ maxWidth: 1300 }}>
        <PageHeader
          icon="📦"
          title="الأرشيف المركزي"
          subtitle="جميع السجلات المؤرشفة من أنظمة المنصة — مع دعم المرفقات والبحث"
          actions={
            canWrite ? (
              <BtnPrimary onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                ＋ إضافة للأرشيف
              </BtnPrimary>
            ) : undefined
          }
        />

        <PageStats stats={stats} />

        <div className="card-white" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <input
              className="input-field"
              placeholder="بحث بالعنوان أو المرجع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <select
              className="input-field"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value="">كل الأنظمة</option>
              {moduleOptions.map((m) => (
                <option key={m} value={m}>
                  {MODULE_LABELS[m] ?? m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <PageLoader label="جاري تحميل الأرشيف..." />
        ) : loadError ? (
          <div className="card-white" style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</p>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>تعذر تحميل الأرشيف</h3>
            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "1rem" }}>{loadError}</p>
            <BtnPrimary onClick={() => void load()}>إعادة المحاولة</BtnPrimary>
          </div>
        ) : rows.length === 0 ? (
          <div className="card-white" style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</p>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>الأرشيف فارغ حالياً</h3>
            <p style={{ color: "#64748b", fontSize: "0.88rem" }}>
              عند أرشفة أي سجل من الجداول سيظهر هنا تلقائياً
            </p>
          </div>
        ) : (
          <div className="card-white" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead>
                <tr>
                  {["المرجع", "العنوان", "النظام المصدر", "مرجع المصدر", "المرفقات", "تاريخ الأرشفة", "إجراءات"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ ...td, fontWeight: 800, color: "#c3152a" }}>{row.refNo}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{row.title}</td>
                    <td style={td}>{row.sourceModuleLabel}</td>
                    <td style={td}>{row.sourceRef}</td>
                    <td style={td}>{row.attachments.length ? `📎 ${row.attachments.length}` : "—"}</td>
                    <td style={td}>{formatDate(row.createdAt, { year: "numeric", month: "numeric", day: "numeric" })}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "nowrap" }}>
                        <button type="button" style={actionBtn} onClick={() => setViewTarget(row)}>👁 عرض</button>
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              style={{ ...actionBtn, color: "#0ea5e9", borderColor: "#bae6fd" }}
                              onClick={() => { setEditTarget(row); setModalOpen(true); }}
                            >
                              ✏️ تعديل
                            </button>
                            <button
                              type="button"
                              style={{ ...actionBtn, color: "#c3152a", borderColor: "#fecaca" }}
                              onClick={() => setDeleteTarget(row)}
                            >
                              🗑 حذف
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ArchiveModal
        open={modalOpen}
        title={editTarget ? "تعديل سجل الأرشيف" : "إضافة سجل للأرشيف"}
        initial={editTarget ?? undefined}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        saveLabel={editTarget ? "حفظ التعديلات" : "إضافة"}
      />

      {viewTarget && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(10,10,18,0.55)", backdropFilter: "blur(5px)", padding: "1rem",
          }}
          onClick={() => setViewTarget(null)}
        >
          <div className="card-white" style={{ padding: "2rem", maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontWeight: 900 }}>عرض السجل المؤرشف</h2>
              <button type="button" onClick={() => setViewTarget(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            {[
              ["مرجع الأرشيف", viewTarget.refNo],
              ["العنوان", viewTarget.title],
              ["النظام", viewTarget.sourceModuleLabel],
              ["مرجع المصدر", viewTarget.sourceRef],
              ["التصنيف", viewTarget.category],
              ["الحالة", viewTarget.status],
              ["أرشف بواسطة", viewTarget.archivedBy],
            ].map(([label, val]) => (
              <div key={label} style={{ marginBottom: "0.55rem", display: "flex", gap: "0.5rem" }}>
                <span style={{ fontWeight: 700, color: "#64748b", minWidth: 120, fontSize: "0.82rem" }}>{label}:</span>
                <span style={{ fontSize: "0.85rem" }}>{val}</span>
              </div>
            ))}
            {viewTarget.description && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8f9fb", borderRadius: "12px" }}>
                <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>الوصف</p>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>{viewTarget.description}</p>
              </div>
            )}
            {viewTarget.attachments.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>المرفقات</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {viewTarget.attachments.map((a, i) => (
                    <a
                      key={`${a.name}-${i}`}
                      href={a.fileData}
                      download={a.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.6rem 0.85rem",
                        background: "#f8f9fb",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        textDecoration: "none",
                        color: "#0a0a12",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                      }}
                    >
                      📎 {a.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: "1.25rem" }}>
              <Link href="/app/archive" style={{ color: "#c3152a", fontWeight: 700, fontSize: "0.82rem" }}>
                العودة لقائمة الأرشيف
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${deleteTarget?.title}" من الأرشيف؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </AppShell>
  );
}
