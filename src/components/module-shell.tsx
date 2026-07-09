"use client";

import { useState, useCallback, useEffect, useId, useMemo, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { StatsRow } from "@/components/ui/stats-row";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Column, ModuleConfig } from "@/data/module-configs";
import { readStorageItem, removeStorageItem, writeStorageItem } from "@/lib/browser-storage";
import { useDialogAccessibility } from "@/lib/dialog-accessibility";
import { canAccessModule } from "@/lib/module-routing";
import { useSession, type SessionUser } from "@/lib/session";

type ToastMsg = { id: number; type: "success" | "error"; text: string };
type ReportFormat = "pdf" | "excel" | "csv";

let toastCounter = 0;
const rowIdentityKeys = ["_id", "id", "caseNo", "jobId", "requestId", "invoiceNo", "ref", "code", "name", "title"];
const reportOptions: { format: ReportFormat; icon: string; label: string; desc: string }[] = [
  { format: "pdf", icon: "📕", label: "تصدير PDF", desc: "يفتح تقريرًا جاهزًا للطباعة أو الحفظ كـ PDF" },
  { format: "excel", icon: "📗", label: "تصدير Excel", desc: "ملف XLS قابل للفتح والتحليل في Excel" },
  { format: "csv", icon: "📘", label: "تصدير CSV", desc: "ملف CSV للاستيراد في أنظمة أخرى" },
];

function createRowId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRowIdentity(row: Record<string, unknown>) {
  for (const key of rowIdentityKeys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return JSON.stringify(row);
}

function normalizeRows(rows: unknown[], slug: string) {
  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
    .map((row, index) => ({
      ...row,
      _id: row._id ?? `${slug}:${index}:${getRowIdentity(row)}`,
    }));
}

function formatReportValue(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "—";
  }

  return String(value);
}

function escapeCsvValue(value: unknown) {
  const text = formatReportValue(value).replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value: unknown) {
  return formatReportValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCsv(columns: Column[], rows: Record<string, unknown>[]) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsvValue(row[column.key])).join(","));
  return ["\uFEFF" + header, ...body].join("\n");
}

function buildTableHtml(title: string, columns: Column[], rows: Record<string, unknown>[]) {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join("")}</tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, Tahoma, sans-serif; color: #0a0a12; direction: rtl; }
    h1 { font-size: 20px; margin: 0 0 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #d8dee8; padding: 8px; text-align: right; }
    th { background: #f1f5f9; font-weight: 700; }
    tr:nth-child(even) td { background: #fafafa; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`;
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function openPrintableReport(title: string, columns: Column[], rows: Record<string, unknown>[]) {
  const reportWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!reportWindow) {
    return false;
  }

  reportWindow.document.write(buildTableHtml(title, columns, rows));
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
  return true;
}

type ModuleShellProps = {
  slug: string;
  config: ModuleConfig;
  moduleTitle: string;
  initialUser?: SessionUser | null;
};

export function ModuleShell({ slug, config, moduleTitle, initialUser = null }: ModuleShellProps) {
  const { user, ready } = useSession(true, initialUser);
  const storageKey = useMemo(() => `naiosh-law:module:${slug}:rows`, [slug]);
  const viewTitleId = useId();
  const reportTitleId = useId();

  const [rows, setRows] = useState<Record<string, unknown>[]>(() => normalizeRows(config.data, slug));
  const [rowsHydrated, setRowsHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null);
  const [viewTarget, setViewTarget] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const toastTimersRef = useRef<number[]>([]);
  const viewDialogRef = useDialogAccessibility<HTMLDivElement>(
    Boolean(viewTarget),
    () => setViewTarget(null)
  );
  const reportDialogRef = useDialogAccessibility<HTMLDivElement>(
    reportOpen,
    () => setReportOpen(false)
  );

  const pushToast = useCallback((type: "success" | "error", text: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, text }]);
    const timer = window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    toastTimersRef.current.push(timer);
  }, []);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      toastTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    let active = true;

    const hydrateRows = () => {
      if (!active) {
        return;
      }

      try {
        const storedRows = readStorageItem(storageKey);
        if (storedRows) {
          const parsed = JSON.parse(storedRows);
          if (Array.isArray(parsed)) {
            setRows(normalizeRows(parsed, slug));
            setRowsHydrated(true);
            return;
          }
        }
      } catch {
        removeStorageItem(storageKey);
      }

      setRows(normalizeRows(config.data, slug));
      setRowsHydrated(true);
    };

    const timer = window.setTimeout(hydrateRows, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [config, slug, storageKey]);

  useEffect(() => {
    if (!rowsHydrated) {
      return;
    }

    try {
      writeStorageItem(storageKey, JSON.stringify(rows));
    } catch {
      // Ignore localStorage quota/privacy failures; the in-memory demo table remains usable.
    }
  }, [config, rows, rowsHydrated, storageKey]);

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

  if (!canAccessModule(slug, user.role)) {
    return (
      <AppShell role={user.role} name={user.name}>
        <div className="card-white" style={{ padding: "2rem", color: "#64748b" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
            لا تملك صلاحية الوصول إلى هذه الوحدة
          </h1>
          <p>تم تقييد هذه الوحدة على حسابات الإدارة فقط حفاظًا على صلاحيات النظام.</p>
        </div>
      </AppShell>
    );
  }

  /* ── Handlers ── */
  const canManageRows = user.role === "admin";
  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (row: Record<string, unknown>) => { setEditTarget(row); setModalOpen(true); };

  const handleSave = (data: Record<string, unknown>) => {
    if (editTarget) {
      const targetId = getRowIdentity(editTarget);
      setRows((prev) =>
        prev.map((row) =>
          getRowIdentity(row) === targetId ? { ...row, ...data, _id: row._id } : row
        )
      );
      pushToast("success", `✅ تم تعديل ${config.entityName} بنجاح`);
    } else {
      const newRow = { ...data, _id: createRowId() };
      setRows((prev) => [newRow, ...prev]);
      pushToast("success", `✅ تمت إضافة ${config.entityName} جديد بنجاح`);
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) {
      return;
    }
    const targetId = getRowIdentity(deleteTarget);
    setRows((prev) => prev.filter((row) => getRowIdentity(row) !== targetId));
    pushToast("success", `🗑️ تم حذف ${config.entityName} بنجاح`);
    setDeleteTarget(null);
  };

  const handleReportExport = (format: ReportFormat, label: string) => {
    const reportTitle = `${moduleTitle} — ${rows.length} سجل`;
    const fileBase = `naiosh-law-${slug}-${new Date().toISOString().slice(0, 10)}`;

    if (format === "pdf") {
      if (openPrintableReport(reportTitle, config.columns, rows)) {
        pushToast("success", "✅ تم فتح التقرير للطباعة أو الحفظ كـ PDF");
      } else {
        pushToast("error", "تعذر فتح نافذة التقرير. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى.");
      }
      setReportOpen(false);
      return;
    }

    if (format === "excel") {
      downloadTextFile(
        `${fileBase}.xls`,
        buildTableHtml(reportTitle, config.columns, rows),
        "application/vnd.ms-excel;charset=utf-8"
      );
    } else {
      downloadTextFile(`${fileBase}.csv`, buildCsv(config.columns, rows), "text/csv;charset=utf-8");
    }

    pushToast("success", `✅ تم تجهيز ${label} وتحميله`);
    setReportOpen(false);
  };

  const firstCol = config.columns[0]?.key;
  const deleteMsg = deleteTarget
    ? `هل أنت متأكد من حذف هذا ${config.entityName}${firstCol && deleteTarget[firstCol] ? ` (${deleteTarget[firstCol]})` : ""}؟ لا يمكن التراجع عن هذا الإجراء.`
    : "";

  /* ── View modal content ── */
  const renderViewModal = () => {
    if (!viewTarget) return null;
    return (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,10,18,0.55)", backdropFilter: "blur(5px)", padding: "1rem" }}
        onClick={() => setViewTarget(null)}
      >
        <div
          ref={viewDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={viewTitleId}
          tabIndex={-1}
          style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
            <h2 id={viewTitleId} style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>تفاصيل {config.entityName}</h2>
            <button
              type="button"
              aria-label="إغلاق التفاصيل"
              onClick={() => setViewTarget(null)}
              style={{ width: 34, height: 34, borderRadius: "9px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
            >✕</button>
          </div>
          <div className="details-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {config.columns.map((col) => (
              <div key={col.key} style={{ background: "#f8f9fb", borderRadius: "12px", padding: "0.9rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{col.label}</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0a0a12" }}>{String(viewTarget[col.key] ?? "—")}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            {canManageRows && (
              <button
                type="button"
                onClick={() => { setViewTarget(null); openEdit(viewTarget); }}
                className="btn-primary"
                style={{ padding: "0.65rem 1.5rem", fontSize: "0.875rem" }}
              >✏️ تعديل</button>
            )}
            <button
              type="button"
              onClick={() => setViewTarget(null)}
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
      <div
        className="module-toasts"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "fixed", bottom: "1.5rem", insetInlineEnd: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ background: t.type === "success" ? "#0a0a12" : "#c3152a", color: "#fff", borderRadius: "12px", padding: "0.85rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fade-in-up 0.25s ease", maxWidth: 320 }}>
            {t.text}
          </div>
        ))}
      </div>

      <div className="module-content" style={{ width: "100%", maxWidth: 1300 }}>
        {/* Page Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.25rem" }}>
                {config.entityName === "قضية" ? "⚖️" :
                 config.entityName === "موكل" ? "👥" :
                 config.entityName === "جلسة" ? "🏛️" :
                 config.entityName === "متابعة" ? "📋" :
                 config.entityName === "سجل مالي" ? "💰" : "📌"} {moduleTitle}
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                إجمالي {rows.length} {config.entityName} — {rowsHydrated ? "جميع البيانات محدثة" : "جاري مزامنة البيانات المحلية"}
              </p>
            </div>
            <div className="module-page-actions" style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.6rem 1.2rem", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600, fontSize: "0.85rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.18s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e2e8f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
              >
                📊 تقارير
              </button>
              {canManageRows && (
                <button
                  type="button"
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
        <div className="card-white module-table-card" style={{ padding: "1.5rem" }}>
          <div aria-busy={!rowsHydrated}>
            <DataTable
              columns={config.columns}
              data={rows}
              onView={setViewTarget}
              onEdit={canManageRows ? openEdit : undefined}
              onDelete={canManageRows ? setDeleteTarget : undefined}
              searchPlaceholder={`بحث في ${config.entityName}ات...`}
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal
          key={editTarget ? getRowIdentity(editTarget) : `new-${slug}`}
          open={modalOpen}
          title={editTarget ? `تعديل ${config.entityName}` : config.addLabel}
          fields={config.formFields}
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          saveLabel={editTarget ? "حفظ التعديلات" : "إضافة"}
        />
      )}

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
          onClick={() => setReportOpen(false)}
        >
          <div
          ref={reportDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={reportTitleId}
          tabIndex={-1}
            style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 460, boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 id={reportTitleId} style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>📊 تصدير التقارير</h2>
              <button type="button" aria-label="إغلاق التصدير" onClick={() => setReportOpen(false)} style={{ width: 34, height: 34, borderRadius: "9px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontSize: "1rem", color: "#64748b" }}>✕</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
              اختر صيغة التصدير المناسبة لـ {rows.length} سجل في {config.entityName}ات
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {reportOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.label}
                  onClick={() => handleReportExport(opt.format, opt.label)}
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
        @media (max-width: 640px) {
          .module-content { max-width: 100% !important; }
          .module-page-actions { width: 100%; }
          .module-page-actions > button { flex: 1 1 140px; justify-content: center; }
          .module-table-card { padding: 1rem !important; }
          .details-grid { grid-template-columns: 1fr !important; }
          .module-toasts {
            bottom: 5.75rem !important;
            inset-inline: 1rem !important;
          }
          .module-toasts > div {
            max-width: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
