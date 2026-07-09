"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { StatsRow } from "@/components/ui/stats-row";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ModuleConfig } from "@/data/module-configs";
import { useSession } from "@/lib/session";
import { canAccessModule } from "@/lib/module-routing";
import { useDialogAccessibility } from "@/lib/dialog-accessibility";

type ToastMsg = { id: number; type: "success" | "error"; text: string };
type ModuleRow = Record<string, unknown> & { _id: string };

let toastCounter = 0;

function getSeedRowId(slug: string, row: Record<string, unknown>, index: number) {
  const stableValue =
    row._id ??
    row.id ??
    row.caseNo ??
    row.ref ??
    row.invoiceNo ??
    row.jobId ??
    row.email ??
    row.name ??
    row.title ??
    index;

  return `${slug}-${String(stableValue)}`;
}

function normalizeRows(slug: string, rows: Record<string, unknown>[]): ModuleRow[] {
  return rows.map((row, index) => ({
    ...row,
    _id: getSeedRowId(slug, row, index),
  }));
}

function isBlankValue(value: unknown) {
  return value === undefined || value === null || value === "";
}

function getNextNumericValue(rows: ModuleRow[], key: string) {
  return rows.reduce((max, row) => {
    const numeric = Number(String(row[key] ?? "").replace(/[^\d]/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0) + 1;
}

function getReferencePrefix(slug: string, rows: ModuleRow[]) {
  const firstRef = rows.find((row) => typeof row.ref === "string")?.ref;
  const prefix = typeof firstRef === "string" ? firstRef.match(/^[A-Za-z]+/)?.[0] : null;
  if (prefix) return prefix;
  return slug
    .split("-")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4) || "REF";
}

function buildDisplayRow(config: ModuleConfig, slug: string, rows: ModuleRow[], data: Record<string, unknown>): ModuleRow {
  const nextSequence = getNextNumericValue(rows, config.columns[0]?.key ?? "_id");
  const year = new Date().getFullYear();
  const row: ModuleRow = { ...data, _id: `${slug}-${Date.now()}` };

  config.columns.forEach((column) => {
    if (!isBlankValue(row[column.key])) return;

    if (column.key === "id") {
      row[column.key] = nextSequence;
    } else if (column.key === "caseNo") {
      row[column.key] = `#${year}-${String(nextSequence).padStart(4, "0")}`;
    } else if (column.key === "invoiceNo") {
      row[column.key] = `INV-${year}-${String(nextSequence).padStart(3, "0")}`;
    } else if (column.key === "ref") {
      row[column.key] = `${getReferencePrefix(slug, rows)}-${String(nextSequence).padStart(3, "0")}`;
    } else if (column.key === "jobId") {
      row[column.key] = `AI-${String(nextSequence).padStart(3, "0")}`;
    } else if (column.type === "number" || column.type === "currency") {
      row[column.key] = "0";
    }
  });

  return row;
}

export function ModuleShell({
  slug,
  config,
  moduleTitle,
}: {
  slug: string;
  config: ModuleConfig | null;
  moduleTitle?: string;
}) {
  const { user, ready, sessionVerified } = useSession(true);
  const toastTimers = useRef<number[]>([]);
  const viewDialogRef = useRef<HTMLDivElement>(null);
  const reportDialogRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<ModuleRow[]>(() => (config ? normalizeRows(slug, config.data) : []));
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ModuleRow | null>(null);
  const [viewTarget, setViewTarget] = useState<ModuleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModuleRow | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    return () => {
      toastTimers.current.forEach(window.clearTimeout);
      toastTimers.current = [];
    };
  }, []);

  const pushToast = useCallback((type: "success" | "error", text: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, text }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current = toastTimers.current.filter((item) => item !== timer);
    }, 3500);
    toastTimers.current.push(timer);
  }, []);

  const closeViewDialog = useCallback(() => setViewTarget(null), []);
  const closeReportDialog = useCallback(() => setReportOpen(false), []);

  useDialogAccessibility({ open: !!viewTarget, containerRef: viewDialogRef, onClose: closeViewDialog });
  useDialogAccessibility({ open: reportOpen, containerRef: reportDialogRef, onClose: closeReportDialog });

  if (!ready || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#c3152a", animation: "spin-slow 0.9s linear infinite", margin: "0 auto 1rem" }} />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <AppShell role={user.role} name={user.name}>
        <div style={{ textAlign: "center", padding: "5rem", color: "#64748b" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>الوحدة غير موجودة</h2>
          <p>الرابط ({slug}) غير معرّف في النظام.</p>
        </div>
      </AppShell>
    );
  }

  if (!canAccessModule(user.role, slug)) {
    return (
      <AppShell role={user.role} name={user.name}>
        <div style={{ textAlign: "center", padding: "5rem 1rem", color: "#64748b" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
          <h2 style={{ fontWeight: 800, marginBottom: "0.5rem", color: "#0a0a12" }}>لا تملك صلاحية الوصول</h2>
          <p style={{ marginBottom: "1.5rem" }}>هذه الوحدة متاحة لحسابات الإدارة فقط.</p>
          <Link href="/app/dashboard" className="btn-primary">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </AppShell>
    );
  }

  /* ── Handlers ── */
  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (row: Record<string, unknown>) => { setEditTarget(row as ModuleRow); setModalOpen(true); };

  const handleSave = (data: Record<string, unknown>) => {
    if (editTarget) {
      setRows((prev) => prev.map((row) => (row._id === editTarget._id ? { ...row, ...data } : row)));
      pushToast("success", `✅ تم تعديل ${config.entityName} بنجاح`);
    } else {
      const newRow = buildDisplayRow(config, slug, rows, data);
      setRows((prev) => [newRow, ...prev]);
      pushToast("success", `✅ تمت إضافة ${config.entityName} جديد بنجاح`);
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = () => {
    setRows((prev) => prev.filter((row) => row._id !== deleteTarget?._id));
    pushToast("success", `🗑️ تم حذف ${config.entityName} بنجاح`);
    setDeleteTarget(null);
  };

  const firstCol = config.columns[0]?.key;
  const deleteMsg = deleteTarget
    ? `هل أنت متأكد من حذف هذا ${config.entityName}${firstCol && deleteTarget[firstCol] ? ` (${deleteTarget[firstCol]})` : ""}؟ لا يمكن التراجع عن هذا الإجراء.`
    : "";
  const modalKey = editTarget
    ? `edit-${slug}-${editTarget._id}`
    : `add-${slug}`;
  const canManageRows = sessionVerified && user.role === "admin";

  /* ── View modal content ── */
  const renderViewModal = () => {
    if (!viewTarget) return null;
    return (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,10,18,0.55)", backdropFilter: "blur(5px)", padding: "1rem" }}
        onClick={closeViewDialog}
      >
        <div
          style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`تفاصيل ${config.entityName}`}
          tabIndex={-1}
          ref={viewDialogRef}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>تفاصيل {config.entityName}</h2>
            <button
              onClick={closeViewDialog}
              style={{ width: 34, height: 34, borderRadius: "9px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
            >✕</button>
          </div>
          <div className="module-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {config.columns.map((col) => (
              <div key={col.key} style={{ background: "#f8f9fb", borderRadius: "12px", padding: "0.9rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{col.label}</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0a0a12" }}>{String(viewTarget[col.key] ?? "—")}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setViewTarget(null); openEdit(viewTarget); }}
              className="btn-primary"
              style={{ padding: "0.65rem 1.5rem", fontSize: "0.875rem" }}
            >✏️ تعديل</button>
            <button
              onClick={closeViewDialog}
              style={{ padding: "0.65rem 1.5rem", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600, fontSize: "0.875rem", color: "#475569" }}
            >إغلاق</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppShell role={user.role} name={user.name}>
      {/* Toasts */}
      <div className="module-toasts" style={{ position: "fixed", bottom: "1.5rem", insetInlineEnd: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ background: t.type === "success" ? "#0a0a12" : "#c3152a", color: "#fff", borderRadius: "12px", padding: "0.85rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fade-in-up 0.25s ease", maxWidth: 320 }}>
            {t.text}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1300 }}>
        {/* Page Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.25rem" }}>
                {config.entityName === "قضية" ? "⚖️" :
                 config.entityName === "موكل" ? "👥" :
                 config.entityName === "جلسة" ? "🏛️" :
                 config.entityName === "متابعة" ? "📋" :
                 config.entityName === "سجل مالي" ? "💰" : "📌"} {moduleTitle ?? config.entityName}
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                إجمالي {rows.length} {config.entityName} — جميع البيانات محدثة
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setReportOpen(true)}
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.6rem 1.2rem", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600, fontSize: "0.85rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.18s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e2e8f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
              >
                📊 تقارير
              </button>
              {canManageRows && (
                <button
                  onClick={openAdd}
                  className="btn-primary"
                  style={{ padding: "0.6rem 1.4rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  ＋ {config.addLabel}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Stats */}
        <StatsRow cards={config.kpis} />

        {/* Data Table */}
        <div className="card-white" style={{ padding: "1.5rem" }}>
          <DataTable
            columns={config.columns}
            data={rows}
            onView={(row) => setViewTarget(row as ModuleRow)}
            onEdit={canManageRows ? openEdit : undefined}
            onDelete={canManageRows ? (row) => setDeleteTarget(row as ModuleRow) : undefined}
            searchPlaceholder={`بحث في ${config.entityName}ات...`}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        key={modalKey}
        open={modalOpen}
        title={editTarget ? `تعديل ${config.entityName}` : config.addLabel}
        fields={config.formFields}
        initial={editTarget ?? undefined}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        saveLabel={editTarget ? "حفظ التعديلات" : "إضافة"}
      />

      {/* View Modal */}
      {renderViewModal()}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteMsg}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Reports Modal */}
      {reportOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,10,18,0.55)", backdropFilter: "blur(5px)", padding: "1rem" }}
          onClick={closeReportDialog}
        >
          <div
            className="report-modal-panel"
            style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 460, boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="تصدير التقارير"
            tabIndex={-1}
            ref={reportDialogRef}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>📊 تصدير التقارير</h2>
              <button onClick={closeReportDialog} style={{ width: 34, height: 34, borderRadius: "9px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontSize: "1rem", color: "#64748b" }}>✕</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
              اختر صيغة التصدير المناسبة لـ {rows.length} سجل في {config.entityName}ات
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { icon: "📕", label: "تصدير PDF", desc: "ملف PDF مُنسّق وجاهز للطباعة" },
                { icon: "📗", label: "تصدير Excel", desc: "ملف XLSX للتحرير والتحليل" },
                { icon: "📘", label: "تصدير CSV", desc: "ملف CSV للاستيراد في أنظمة أخرى" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => { pushToast("success", `✅ جاري تحضير ${opt.label}...`); closeReportDialog(); }}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "#f8f9fb", border: "1.5px solid #e2e8f0", borderRadius: "12px", cursor: "pointer", textAlign: "start", fontFamily: "var(--font-cairo)", width: "100%", transition: "all 0.18s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#c3152a"; (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.background = "#f8f9fb"; }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{opt.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0a0a12" }}>{opt.label}</p>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.1rem" }}>{opt.desc}</p>
                  </div>
                  <span style={{ marginInlineStart: "auto", color: "#c3152a", fontSize: "1.1rem" }}>←</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .module-toasts {
            inset-inline: 1rem !important;
            bottom: calc(5.75rem + env(safe-area-inset-bottom)) !important;
          }
          .module-toasts > div {
            max-width: none !important;
          }
        }
        @media (max-width: 560px) {
          .module-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .report-modal-panel {
            padding: 1.25rem !important;
            max-height: 86vh;
            overflow-y: auto;
          }
        }
      `}</style>
    </AppShell>
  );
}
