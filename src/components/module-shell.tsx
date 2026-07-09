"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatsRow } from "@/components/ui/stats-row";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ModuleConfig } from "@/data/module-configs";
import { moduleMap } from "@/data/modules";
import { canWriteRole, useSession } from "@/lib/session";
import { getModuleApiEndpoint } from "@/lib/module-api";

type ToastMsg = { id: number; type: "success" | "error"; text: string };

let toastCounter = 0;
const moduleStoragePrefix = "naiosh-law-module-rows:";
const identityKeys = ["_id", "id", "caseNo", "ref", "jobId", "email", "endpoint", "name", "title"];

type ModuleStorageKeys = {
  scoped: string;
  legacy: string;
};

function storageScope(value: string) {
  return encodeURIComponent(value.trim().toLowerCase());
}

function getModuleStorageKeys(slug: string, email: string): ModuleStorageKeys {
  const legacy = `${moduleStoragePrefix}${slug}`;
  return {
    scoped: `${legacy}:${storageScope(email)}`,
    legacy,
  };
}

function readStoredRows(storageKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : null;
  } catch {
    removeStoredRows(storageKey);
    return null;
  }
}

function removeStoredRows(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Storage may be unavailable in private or locked-down browser contexts.
  }
}

function loadStoredRows(keys: ModuleStorageKeys) {
  return readStoredRows(keys.scoped);
}

function getRowIdentity(row: Record<string, unknown> | null) {
  if (!row) {
    return "";
  }

  for (const key of identityKeys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") {
      return `${key}:${String(value)}`;
    }
  }

  return JSON.stringify(row);
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ModuleShell({ slug, config }: { slug: string; config: ModuleConfig }) {
  const { user, ready } = useSession(true);
  const apiEndpoint = getModuleApiEndpoint(slug);
  const canWrite = user ? canWriteRole(user.role) : false;

  const [rows, setRows] = useState<Record<string, unknown>[]>(config.data);
  const [rowsHydrated, setRowsHydrated] = useState(false);
  const [loadingData, setLoadingData] = useState(!!apiEndpoint);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null);
  const [viewTarget, setViewTarget] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const viewDialogRef = useRef<HTMLDivElement>(null);
  const reportDialogRef = useRef<HTMLDivElement>(null);
  const toastTimersRef = useRef<number[]>([]);
  const userEmail = user?.email;
  const storageKeys = useMemo(
    () => (userEmail ? getModuleStorageKeys(slug, userEmail) : null),
    [slug, userEmail]
  );

  const pushToast = useCallback((type: "success" | "error", text: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, text }]);
    const timeoutId = window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    toastTimersRef.current.push(timeoutId);
  }, []);

  const loadServerRows = useCallback(async () => {
    if (!apiEndpoint) {
      return;
    }

    setLoadingData(true);
    try {
      const response = await fetch(apiEndpoint, { cache: "no-store", credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to load module rows.");
      }
      const data = (await response.json()) as unknown;
      if (!Array.isArray(data)) {
        throw new Error("Module API returned an invalid payload.");
      }
      setRows(data as Record<string, unknown>[]);
    } catch {
      pushToast("error", "تعذر تحميل البيانات من الخادم، سيتم عرض البيانات التجريبية.");
      setRows(config.data);
    } finally {
      setRowsHydrated(true);
      setLoadingData(false);
    }
  }, [apiEndpoint, config.data, pushToast]);

  useEffect(() => {
    if (apiEndpoint) {
      void loadServerRows();
      return;
    }

    if (!storageKeys) {
      return;
    }

    const hydrationTimer = window.setTimeout(() => {
      setRows(loadStoredRows(storageKeys) ?? config.data);
      removeStoredRows(storageKeys.legacy);
      setRowsHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, [apiEndpoint, config, loadServerRows, storageKeys]);

  useEffect(() => {
    if (apiEndpoint || !storageKeys || !rowsHydrated || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(storageKeys.scoped, JSON.stringify(rows));
    } catch {
      // Keep the in-memory table usable if browser storage quota is unavailable.
    }
  }, [apiEndpoint, rows, rowsHydrated, storageKeys]);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      toastTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const dialogRef = viewTarget ? viewDialogRef : reportOpen ? reportDialogRef : null;
    if (!dialogRef) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const focusableSelector = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const focusFirst = () => dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewTarget(null);
        setReportOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    focusFirst();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [reportOpen, viewTarget]);

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

  /* ── Handlers ── */
  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (row: Record<string, unknown>) => { setEditTarget(row); setModalOpen(true); };

  const handleSave = async (data: Record<string, unknown>) => {
    if (apiEndpoint && canWrite) {
      try {
        const response = await fetch(editTarget?.id ? `${apiEndpoint}/${editTarget.id}` : apiEndpoint, {
          method: editTarget?.id ? "PATCH" : "POST",
          cache: "no-store",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error("Failed to save module row.");
        }
        await loadServerRows();
        pushToast(
          "success",
          editTarget ? `✅ تم تعديل ${config.entityName} بنجاح` : `✅ تمت إضافة ${config.entityName} جديد بنجاح`
        );
      } catch {
        pushToast("error", "تعذر حفظ البيانات على الخادم الآن.");
        return;
      }
      setModalOpen(false);
      setEditTarget(null);
      return;
    }

    if (editTarget) {
      const targetIdentity = getRowIdentity(editTarget);
      setRows((prev) => prev.map((r) => (getRowIdentity(r) === targetIdentity ? { ...r, ...data } : r)));
      pushToast("success", `✅ تم تعديل ${config.entityName} بنجاح`);
    } else {
      const newRow = { ...data, _id: Date.now() };
      setRows((prev) => [newRow, ...prev]);
      pushToast("success", `✅ تمت إضافة ${config.entityName} جديد بنجاح`);
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (apiEndpoint && canWrite && deleteTarget?.id) {
      try {
        const response = await fetch(`${apiEndpoint}/${deleteTarget.id}`, {
          method: "DELETE",
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to delete module row.");
        }
        await loadServerRows();
        pushToast("success", `🗑️ تم حذف ${config.entityName} بنجاح`);
      } catch {
        pushToast("error", "تعذر حذف السجل من الخادم الآن.");
      }
      setDeleteTarget(null);
      return;
    }

    const targetIdentity = getRowIdentity(deleteTarget);
    setRows((prev) => prev.filter((r) => getRowIdentity(r) !== targetIdentity));
    pushToast("success", `🗑️ تم حذف ${config.entityName} بنجاح`);
    setDeleteTarget(null);
  };

  const exportRowsAsCsv = () => {
    try {
      const headers = config.columns.map((column) => column.label);
      const csvRows = rows.map((row) => config.columns.map((column) => escapeCsvCell(row[column.key])).join(","));
      const csv = [headers.map(escapeCsvCell).join(","), ...csvRows].join("\n");
      const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
      pushToast("success", "✅ تم تجهيز ملف CSV للتنزيل");
    } catch {
      pushToast("error", "تعذر تصدير التقرير الآن.");
    }
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
          aria-label={`تفاصيل ${config.entityName}`}
          tabIndex={-1}
          className="module-detail-panel"
          style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>تفاصيل {config.entityName}</h2>
            <button
              onClick={() => setViewTarget(null)}
              type="button"
              aria-label="إغلاق التفاصيل"
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
          <div className="module-detail-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            {canWrite && (
              <button
                onClick={() => { setViewTarget(null); openEdit(viewTarget); }}
                type="button"
                className="btn-primary"
                style={{ padding: "0.65rem 1.5rem", fontSize: "0.875rem" }}
              >✏️ تعديل</button>
            )}
            <button
              onClick={() => setViewTarget(null)}
              type="button"
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
      <div className="module-toast-stack" style={{ position: "fixed", bottom: "1.5rem", insetInlineEnd: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                 config.entityName === "سجل مالي" ? "💰" : "📌"} {moduleMap[slug]?.title ?? config.entityName}
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
              {canWrite && (
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
          {loadingData ? (
            <p style={{ color: "#64748b", padding: "2rem", textAlign: "center" }}>جاري تحميل البيانات...</p>
          ) : (
            <DataTable
              columns={config.columns}
              data={rows}
              onView={setViewTarget}
              onEdit={canWrite ? openEdit : undefined}
              onDelete={canWrite ? setDeleteTarget : undefined}
              searchPlaceholder={`بحث في ${config.entityName}ات...`}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal
          key={getRowIdentity(editTarget) || "new"}
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
            aria-label="تصدير التقارير"
            tabIndex={-1}
            style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 460, boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>📊 تصدير التقارير</h2>
              <button type="button" aria-label="إغلاق نافذة التقارير" onClick={() => setReportOpen(false)} style={{ width: 34, height: 34, borderRadius: "9px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontSize: "1rem", color: "#64748b" }}>✕</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
              اختر صيغة التصدير المناسبة لـ {rows.length} سجل في {config.entityName}ات
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { icon: "📕", label: "تصدير PDF", desc: "قريبًا: ملف PDF مُنسّق وجاهز للطباعة", disabled: true },
                { icon: "📗", label: "تصدير Excel", desc: "قريبًا: ملف XLSX للتحرير والتحليل", disabled: true },
                { icon: "📘", label: "تصدير CSV", desc: "ملف CSV للاستيراد في أنظمة أخرى", disabled: false },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.label}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (opt.label.includes("CSV")) {
                      exportRowsAsCsv();
                      return;
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "#f8f9fb", border: "1.5px solid #e2e8f0", borderRadius: "12px", cursor: opt.disabled ? "not-allowed" : "pointer", textAlign: "start", fontFamily: "var(--font-cairo)", width: "100%", transition: "all 0.18s", opacity: opt.disabled ? 0.62 : 1 }}
                  onMouseEnter={(e) => { if (!opt.disabled) { (e.currentTarget as HTMLElement).style.borderColor = "#c3152a"; (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.04)"; } }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.background = "#f8f9fb"; }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{opt.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0a0a12" }}>{opt.label}</p>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.1rem" }}>{opt.desc}</p>
                  </div>
                  <span style={{ marginInlineStart: "auto", color: opt.disabled ? "#94a3b8" : "#c3152a", fontSize: "1.1rem" }}>
                    {opt.disabled ? "قريبًا" : "←"}
                  </span>
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
          .module-toast-stack {
            bottom: 5.75rem !important;
            inset-inline: 1rem !important;
          }
          .module-toast-stack > div {
            max-width: none !important;
          }
        }
        @media (max-width: 600px) {
          .module-detail-panel {
            padding: 1.25rem !important;
          }
          .module-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .module-detail-actions {
            flex-direction: column-reverse !important;
          }
          .module-detail-actions button {
            width: 100%;
          }
        }
      `}</style>
    </AppShell>
  );
}
