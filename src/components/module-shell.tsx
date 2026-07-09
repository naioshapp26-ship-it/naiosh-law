"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LoadingScreen } from "@/components/loading-screen";
import { StatsRow } from "@/components/ui/stats-row";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ModuleConfig } from "@/data/module-configs";
import { moduleIconMap } from "@/data/module-icons";
import { moduleMap } from "@/data/modules";
import { readBrowserStorage, removeBrowserStorage, writeBrowserStorage } from "@/lib/browser-storage";
import { useSession } from "@/lib/session";

type ToastMsg = { id: string; type: "success" | "error"; text: string };

const rowIdKey = "_rowId";

const entityPluralMap: Record<string, string> = {
  قضية: "قضايا",
  موكل: "موكلين",
  جلسة: "جلسات",
  متابعة: "متابعات",
  "سجل مالي": "سجلات مالية",
  خدمة: "خدمات",
  استشارة: "استشارات",
  طلب: "طلبات",
  شكوى: "شكاوى",
  قالب: "قوالب",
  تقرير: "تقارير",
  مستخدم: "مستخدمين",
  إشعار: "إشعارات",
  تكامل: "تكاملات",
  "مهمة AI": "مهام AI",
  مهمة: "مهام",
};

function seedRows(slug: string, rows: Record<string, unknown>[]) {
  return rows.map((row, index) => ({
    ...row,
    [rowIdKey]: row[rowIdKey] ?? `${slug}-${index}`,
  }));
}

function getEntityPlural(entityName: string) {
  return entityPluralMap[entityName] ?? entityName;
}

function getRowsStorageKey(slug: string) {
  return `naiosh-law-module-rows:${slug}`;
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.every((item) => !!item && typeof item === "object" && !Array.isArray(item))
  );
}

function loadRows(slug: string, fallbackRows: Record<string, unknown>[]) {
  const seededFallback = seedRows(slug, fallbackRows);

  if (typeof window === "undefined") {
    return seededFallback;
  }

  const storageKey = getRowsStorageKey(slug);
  const rawRows = readBrowserStorage(storageKey);

  if (!rawRows) {
    return seededFallback;
  }

  try {
    const parsed = JSON.parse(rawRows) as unknown;
    if (isRecordArray(parsed)) {
      return seedRows(slug, parsed);
    }
  } catch {
    removeBrowserStorage(storageKey);
  }

  return seededFallback;
}

function persistRows(slug: string, rows: Record<string, unknown>[]) {
  writeBrowserStorage(getRowsStorageKey(slug), JSON.stringify(rows));
}

type ModuleShellProps = {
  slug: string;
  config: ModuleConfig;
};

export function ModuleShell({ slug, config }: ModuleShellProps) {
  const { user, ready } = useSession(true);
  const isAdmin = user?.role === "admin";

  const [rows, setRows] = useState<Record<string, unknown>[]>(() => loadRows(slug, config.data));
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null);
  const [viewTarget, setViewTarget] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  const pushToast = useCallback((type: "success" | "error", text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    persistRows(slug, rows);
  }, [rows, slug]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = getRowsStorageKey(slug);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setRows(loadRows(slug, config.data));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [config.data, slug]);

  if (!ready || !user) {
    return <LoadingScreen />;
  }

  /* ── Handlers ── */
  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (row: Record<string, unknown>) => { setEditTarget(row); setModalOpen(true); };

  const handleSave = (data: Record<string, unknown>) => {
    if (editTarget) {
      setRows((prev) => prev.map((row) => (row[rowIdKey] === editTarget[rowIdKey] ? { ...row, ...data } : row)));
      pushToast("success", `✅ تم تعديل ${config.entityName} بنجاح`);
    } else {
      const newRow = { ...data, [rowIdKey]: `${slug}-${Date.now()}` };
      setRows((prev) => [newRow, ...prev]);
      pushToast("success", `✅ تمت إضافة ${config.entityName} جديد بنجاح`);
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = () => {
    setRows((prev) => prev.filter((row) => row[rowIdKey] !== deleteTarget?.[rowIdKey]));
    pushToast("success", `🗑️ تم حذف ${config.entityName} بنجاح`);
    setDeleteTarget(null);
  };

  const downloadCsvReport = () => {
    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      config.columns.map((column) => escapeCsv(column.label)).join(","),
      ...rows.map((row) => config.columns.map((column) => escapeCsv(row[column.key])).join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${slug}-report.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    pushToast("success", "✅ تم تجهيز ملف CSV بنجاح");
    setReportOpen(false);
  };

  const firstCol = config.columns[0]?.key;
  const deleteMsg = deleteTarget
    ? `هل أنت متأكد من حذف هذا ${config.entityName}${firstCol && deleteTarget[firstCol] ? ` (${deleteTarget[firstCol]})` : ""}؟ لا يمكن التراجع عن هذا الإجراء.`
    : "";
  const entityPlural = getEntityPlural(config.entityName);

  /* ── View modal content ── */
  const renderViewModal = () => {
    if (!viewTarget) return null;
    return (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,10,18,0.55)", backdropFilter: "blur(5px)", padding: "1rem" }}
        onClick={() => setViewTarget(null)}
      >
        <div
          style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>تفاصيل {config.entityName}</h2>
            <button
              onClick={() => setViewTarget(null)}
              style={{ width: 34, height: 34, borderRadius: "9px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
            >✕</button>
          </div>
          <div className="view-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {config.columns.map((col) => (
              <div key={col.key} style={{ background: "#f8f9fb", borderRadius: "12px", padding: "0.9rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{col.label}</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0a0a12" }}>{String(viewTarget[col.key] ?? "—")}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            {isAdmin && (
              <button
                onClick={() => { setViewTarget(null); openEdit(viewTarget); }}
                className="btn-primary"
                style={{ padding: "0.65rem 1.5rem", fontSize: "0.875rem" }}
              >✏️ تعديل</button>
            )}
            <button
              onClick={() => setViewTarget(null)}
              style={{ padding: "0.65rem 1.5rem", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600, fontSize: "0.875rem", color: "#475569" }}
            >إغلاق</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppShell role={user.role} name={user.name}>
      {/* Toasts */}
      <div className="toast-stack" style={{ position: "fixed", bottom: "1.5rem", insetInlineEnd: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                {moduleIconMap[slug] ?? "📌"} {moduleMap[slug]?.title ?? config.entityName}
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                إجمالي {rows.length} {entityPlural} — جميع البيانات محدثة
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setReportOpen(true)}
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.6rem 1.2rem", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600, fontSize: "0.85rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.18s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e2e8f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
              >
                📊 تقارير
              </button>
              {isAdmin && (
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
            onView={setViewTarget}
            onEdit={isAdmin ? openEdit : undefined}
            onDelete={isAdmin ? setDeleteTarget : undefined}
            searchPlaceholder={`بحث في ${entityPlural}...`}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
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
          onClick={() => setReportOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 460, boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>📊 تصدير التقارير</h2>
              <button onClick={() => setReportOpen(false)} style={{ width: 34, height: 34, borderRadius: "9px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontSize: "1rem", color: "#64748b" }}>✕</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
              اختر صيغة التصدير المناسبة لـ {rows.length} سجل في {entityPlural}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { icon: "📘", label: "تصدير CSV", desc: "ملف CSV للاستيراد في أنظمة أخرى", action: downloadCsvReport },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "#f8f9fb", border: "1.5px solid #e2e8f0", borderRadius: "12px", cursor: "pointer", textAlign: "start", fontFamily: "var(--font)", width: "100%", transition: "all 0.18s" }}
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
        @media (max-width: 600px) {
          .view-modal-grid { grid-template-columns: 1fr !important; }
          .toast-stack {
            inset-inline: 1rem !important;
            bottom: 5.5rem !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
