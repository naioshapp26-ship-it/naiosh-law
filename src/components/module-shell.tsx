"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LoadingScreen } from "@/components/loading-screen";
import { StatsRow } from "@/components/ui/stats-row";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ModuleConfig } from "@/data/module-configs";
import { moduleIconMap } from "@/data/module-icons";
import { canAccessModule } from "@/lib/module-access";
import { useSession } from "@/lib/session";
import type { SessionUser } from "@/lib/auth-session";

type ToastMsg = { id: string; type: "success" | "error"; text: string };
type MemoryRows = {
  scopeKey: string;
  rows: Record<string, unknown>[];
};

const rowIdKey = "_rowId";
const moduleRowsChangeEvent = "naiosh-law-module-rows-change";

type RowsSnapshot = string | null | undefined;

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

function seedRows(slug: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row, index): Record<string, unknown> => ({
    ...row,
    [rowIdKey]: String(row[rowIdKey] ?? `${slug}-${index}`),
  }));
}

function getEntityPlural(entityName: string) {
  return entityPluralMap[entityName] ?? entityName;
}

function getRowsStorageScope(email?: string) {
  return email?.trim().toLocaleLowerCase("en-US") || "anonymous";
}

function getRowsStorageKey(slug: string, scope: string) {
  return `naiosh-law-module-rows:${scope}:${slug}`;
}

function getRowsSnapshot(slug: string, scope: string): RowsSnapshot {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage.getItem(getRowsStorageKey(slug, scope));
  } catch {
    return null;
  }
}

function getServerRowsSnapshot(): RowsSnapshot {
  return undefined;
}

function subscribeToRowsChange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(moduleRowsChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(moduleRowsChangeEvent, onStoreChange);
  };
}

function notifyRowsChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(moduleRowsChangeEvent));
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.every((item) => !!item && typeof item === "object" && !Array.isArray(item))
  );
}

function rowsFromSnapshot(slug: string, fallbackRows: Record<string, unknown>[], rawRows: RowsSnapshot) {
  const seededFallback = seedRows(slug, fallbackRows);

  if (rawRows === undefined || !rawRows) {
    return seededFallback;
  }

  try {
    const parsed = JSON.parse(rawRows) as unknown;
    if (isRecordArray(parsed)) {
      return seedRows(slug, parsed);
    }
  } catch {
    // Invalid stored rows are ignored; the next successful edit will overwrite them.
  }

  return seededFallback;
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ar-EG");
}

function clientMatchTerms(user: SessionUser) {
  const terms = new Set([normalizeSearchText(user.name), normalizeSearchText(user.email)]);
  const nameParts = normalizeSearchText(user.name).split(" ").filter(Boolean);

  if (nameParts.length > 1) {
    terms.add(`${nameParts[0]} ${nameParts[nameParts.length - 1]}`);
  }

  return [...terms].filter(Boolean);
}

function rowBelongsToClient(slug: string, row: Record<string, unknown>, user: SessionUser) {
  const terms = clientMatchTerms(user);

  if (slug === "notifications-center") {
    const audience = normalizeSearchText(row.audience);
    const searchableValues = ["client", "name", "email"].map((key) => normalizeSearchText(row[key]));

    return (
      audience === normalizeSearchText(user.name) ||
      audience === normalizeSearchText(user.email) ||
      searchableValues.some((value) => terms.some((term) => value === term || value.includes(term)))
    );
  }

  const searchableValues = ["client", "name", "email"].map((key) => normalizeSearchText(row[key]));

  return searchableValues.some((value) => terms.some((term) => value === term || value.includes(term)));
}

function getVisibleRows(slug: string, rows: Record<string, unknown>[], user: SessionUser) {
  if (user.role === "admin") {
    return rows;
  }

  return rows.filter((row) => rowBelongsToClient(slug, row, user));
}

function modulePrefix(slug: string) {
  return slug
    .split("-")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 4) || "ROW";
}

function generatePrimaryValue(firstColumnKey: string, slug: string, rows: Record<string, unknown>[]) {
  if (firstColumnKey === "id") {
    const maxId = rows.reduce((max, row) => {
      const id = Number(row.id);
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    return maxId + 1;
  }

  const suffix = Date.now().toString().slice(-6);

  if (firstColumnKey === "caseNo") {
    return `#${new Date().getFullYear()}-${suffix}`;
  }

  if (firstColumnKey === "invoiceNo") {
    return `INV-${new Date().getFullYear()}-${suffix}`;
  }

  if (firstColumnKey === "jobId") {
    return `AI-${suffix}`;
  }

  return `${modulePrefix(slug)}-${suffix}`;
}

function withGeneratedPrimaryValue(
  data: Record<string, unknown>,
  config: ModuleConfig,
  slug: string,
  rows: Record<string, unknown>[]
) {
  const firstColumnKey = config.columns[0]?.key;

  if (!firstColumnKey || String(data[firstColumnKey] ?? "").trim()) {
    return data;
  }

  return {
    ...data,
    [firstColumnKey]: generatePrimaryValue(firstColumnKey, slug, rows),
  };
}

function persistRows(slug: string, scope: string, rows: Record<string, unknown>[]) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(getRowsStorageKey(slug, scope), JSON.stringify(rows));
  } catch {
    notifyRowsChange();
    return false;
  }
  notifyRowsChange();
  return true;
}

export function ModuleShell({ slug, config, title }: { slug: string; config: ModuleConfig; title: string }) {
  const { user, ready, verificationError } = useSession(true);
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const hasModuleAccess = !!user && canAccessModule(user.role, slug);
  const rowsStorageScope = getRowsStorageScope(user?.email);
  const rowsStateKey = `${rowsStorageScope}:${slug}`;
  const storedRowsSnapshot = useSyncExternalStore(
    subscribeToRowsChange,
    () => getRowsSnapshot(slug, rowsStorageScope),
    getServerRowsSnapshot
  );
  const storedRows = useMemo(
    () => rowsFromSnapshot(slug, config.data, storedRowsSnapshot),
    [config.data, slug, storedRowsSnapshot]
  );

  const [memoryRows, setMemoryRows] = useState<MemoryRows | null>(null);
  const rows = memoryRows?.scopeKey === rowsStateKey ? memoryRows.rows : storedRows;
  const visibleRows = useMemo(() => (user ? getVisibleRows(slug, rows, user) : rows), [rows, slug, user]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null);
  const [viewTarget, setViewTarget] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const toastTimers = useRef<Map<string, number>>(new Map());

  const pushToast = useCallback((type: "success" | "error", text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    const timeoutId = window.setTimeout(() => {
      toastTimers.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);

    toastTimers.current.set(id, timeoutId);
  }, []);

  const updateRows = useCallback(
    (updater: (currentRows: Record<string, unknown>[]) => Record<string, unknown>[]) => {
      const nextRows = updater(rows);
      setMemoryRows({ scopeKey: rowsStateKey, rows: nextRows });
      return persistRows(slug, rowsStorageScope, nextRows);
    },
    [rows, rowsStateKey, rowsStorageScope, slug]
  );

  useEffect(() => {
    if (ready && user && !hasModuleAccess) {
      router.replace("/app/dashboard");
    }
  }, [hasModuleAccess, ready, router, user]);

  useEffect(() => {
    const timers = toastTimers.current;

    return () => {
      timers.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!viewTarget && !reportOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewTarget(null);
        setReportOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [reportOpen, viewTarget]);

  if (!ready || !user) {
    return <LoadingScreen label={verificationError || undefined} />;
  }

  if (!hasModuleAccess) {
    return <LoadingScreen label="جاري تحويلك إلى لوحة التحكم..." />;
  }

  /* ── Handlers ── */
  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (row: Record<string, unknown>) => { setEditTarget(row); setModalOpen(true); };

  const handleSave = (data: Record<string, unknown>) => {
    const persistenceError = "تم تطبيق التغيير مؤقتًا فقط؛ تعذر حفظه في مساحة التخزين المحلية.";

    if (editTarget) {
      const persisted = updateRows((prev) =>
        prev.map((row) => (row[rowIdKey] === editTarget[rowIdKey] ? { ...row, ...data } : row))
      );
      pushToast(
        persisted ? "success" : "error",
        persisted ? `✅ تم تعديل ${config.entityName} بنجاح` : persistenceError
      );
    } else {
      const newRow = {
        ...withGeneratedPrimaryValue(data, config, slug, rows),
        [rowIdKey]: `${slug}-${Date.now()}`,
      };
      const persisted = updateRows((prev) => [newRow, ...prev]);
      pushToast(
        persisted ? "success" : "error",
        persisted ? `✅ تمت إضافة ${config.entityName} جديد بنجاح` : persistenceError
      );
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = () => {
    const persisted = updateRows((prev) => prev.filter((row) => row[rowIdKey] !== deleteTarget?.[rowIdKey]));
    pushToast(
      persisted ? "success" : "error",
      persisted ? `🗑️ تم حذف ${config.entityName} بنجاح` : "تم حذف السجل مؤقتًا فقط؛ تعذر تحديث التخزين المحلي."
    );
    setDeleteTarget(null);
  };

  const downloadCsvReport = () => {
    const escapeCsv = (value: unknown) => {
      const rawValue = String(value ?? "");
      const safeValue = /^[=+\-@]/u.test(rawValue.trimStart()) ? `'${rawValue}` : rawValue;

      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const csv = [
      config.columns.map((column) => escapeCsv(column.label)).join(","),
      ...visibleRows.map((row) => config.columns.map((column) => escapeCsv(row[column.key])).join(",")),
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
  const entityPlural = config ? getEntityPlural(config.entityName) : "";

  /* ── View modal content ── */
  const renderViewModal = () => {
    if (!viewTarget) return null;
    return (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,10,18,0.55)", backdropFilter: "blur(5px)", padding: "1rem" }}
        onClick={() => setViewTarget(null)}
        role="presentation"
      >
        <div
          style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`تفاصيل ${config.entityName}`}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>تفاصيل {config.entityName}</h2>
            <button
              onClick={() => setViewTarget(null)}
              aria-label="إغلاق تفاصيل السجل"
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
                {moduleIconMap[slug] ?? "📌"} {title}
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                إجمالي {visibleRows.length} {entityPlural} — جميع البيانات محدثة
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
            data={visibleRows}
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
          role="presentation"
        >
          <div
            style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 460, maxHeight: "min(90vh, calc(100vh - 2rem))", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fade-in-up 0.22s ease" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="تصدير التقارير"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0a0a12" }}>📊 تصدير التقارير</h2>
              <button onClick={() => setReportOpen(false)} aria-label="إغلاق تصدير التقارير" style={{ width: 34, height: 34, borderRadius: "9px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontSize: "1rem", color: "#64748b" }}>✕</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
              اختر صيغة التصدير المناسبة لـ {visibleRows.length} سجل في {entityPlural}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={downloadCsvReport}
                style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "#f8f9fb", border: "1.5px solid #e2e8f0", borderRadius: "12px", cursor: "pointer", textAlign: "start", fontFamily: "var(--font)", width: "100%", transition: "all 0.18s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#c3152a"; (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.background = "#f8f9fb"; }}
              >
                <span style={{ fontSize: "1.5rem" }}>📘</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0a0a12" }}>تصدير CSV</p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.1rem" }}>
                    ملف CSV للاستيراد في أنظمة أخرى
                  </p>
                </div>
                <span style={{ marginInlineStart: "auto", color: "#c3152a", fontSize: "1.1rem" }}>←</span>
              </button>
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
          .card-white { padding-inline: 1rem !important; }
          .toast-stack {
            inset-inline: 1rem !important;
            bottom: 5.5rem !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
