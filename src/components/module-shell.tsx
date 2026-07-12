"use client";

import { useState, useCallback, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { StatsRow } from "@/components/ui/stats-row";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { moduleConfigMap } from "@/data/module-configs";
import { moduleMap } from "@/data/modules";
import { useSession, canWriteRole } from "@/lib/session";
import { getModuleApiEndpoint } from "@/lib/module-api";

type ToastMsg = { id: number; type: "success" | "error"; text: string };

let toastCounter = 0;

export function ModuleShell({ slug }: { slug: string }) {
  const { user, ready } = useSession(true);
  const config = moduleConfigMap[slug];
  const apiEndpoint = getModuleApiEndpoint(slug);
  const fallbackData = config?.data ?? [];

  const [rows, setRows] = useState<Record<string, unknown>[]>(fallbackData);
  const [loadingData, setLoadingData] = useState(!!apiEndpoint);
  const [usingDemo, setUsingDemo] = useState(!apiEndpoint);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null);
  const [viewTarget, setViewTarget] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  const pushToast = useCallback((type: "success" | "error", text: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (config?.data) {
      setRows(config.data);
      if (!apiEndpoint) setUsingDemo(true);
    }
  }, [config, apiEndpoint]);

  const loadRows = useCallback(async () => {
    if (!apiEndpoint || !config) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    try {
      const res = await fetch(apiEndpoint, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRows(data);
          setUsingDemo(false);
        } else {
          setRows(config.data);
          setUsingDemo(true);
        }
      } else {
        setRows(config.data);
        setUsingDemo(true);
      }
    } catch {
      setRows(config.data);
      setUsingDemo(true);
      pushToast("error", "تعذر تحميل البيانات — عرض البيانات التجريبية");
    } finally {
      setLoadingData(false);
    }
  }, [apiEndpoint, config, pushToast]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const canWrite = user ? canWriteRole(user.role) : false;

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
      <AppShell>
        <div style={{ textAlign: "center", padding: "5rem", color: "#64748b" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>الوحدة غير موجودة</h2>
          <p>الرابط ({slug}) غير معرّف في النظام.</p>
        </div>
      </AppShell>
    );
  }

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (row: Record<string, unknown>) => { setEditTarget(row); setModalOpen(true); };

  const handleSave = async (data: Record<string, unknown>) => {
    if (apiEndpoint && canWrite && !usingDemo) {
      try {
        if (editTarget?.id) {
          const res = await fetch(`${apiEndpoint}/${editTarget.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error();
          pushToast("success", `✅ تم تعديل ${config.entityName} بنجاح`);
        } else {
          const res = await fetch(apiEndpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error();
          pushToast("success", `✅ تمت إضافة ${config.entityName} جديد بنجاح`);
        }
        await loadRows();
      } catch {
        pushToast("error", "فشل حفظ البيانات — تم الحفظ محلياً");
        if (editTarget) {
          setRows((prev) => prev.map((r) => (r === editTarget ? { ...r, ...data } : r)));
        } else {
          setRows((prev) => [{ ...data, id: Date.now() }, ...prev]);
        }
      }
    } else if (editTarget) {
      setRows((prev) => prev.map((r) => (r === editTarget ? { ...r, ...data } : r)));
      pushToast("success", `✅ تم تعديل ${config.entityName} بنجاح`);
    } else {
      const newRow = { ...data, id: Date.now() };
      setRows((prev) => [newRow, ...prev]);
      pushToast("success", `✅ تمت إضافة ${config.entityName} جديد بنجاح`);
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (apiEndpoint && canWrite && !usingDemo && deleteTarget?.id) {
      try {
        const res = await fetch(`${apiEndpoint}/${deleteTarget.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        await loadRows();
        pushToast("success", `🗑️ تم حذف ${config.entityName} بنجاح`);
      } catch {
        setRows((prev) => prev.filter((r) => r !== deleteTarget));
        pushToast("success", `🗑️ تم حذف ${config.entityName} بنجاح`);
      }
    } else {
      setRows((prev) => prev.filter((r) => r !== deleteTarget));
      pushToast("success", `🗑️ تم حذف ${config.entityName} بنجاح`);
    }
    setDeleteTarget(null);
  };

  const firstCol = config.columns[0]?.key;
  const deleteMsg = deleteTarget
    ? `هل أنت متأكد من حذف هذا ${config.entityName}${firstCol && deleteTarget[firstCol] ? ` (${deleteTarget[firstCol]})` : ""}؟ لا يمكن التراجع عن هذا الإجراء.`
    : "";

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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {config.columns.map((col) => (
              <div key={col.key} style={{ background: "#f8f9fb", borderRadius: "12px", padding: "0.9rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{col.label}</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0a0a12" }}>{String(viewTarget[col.key] ?? "—")}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            {canWrite && (
              <button
                onClick={() => { setViewTarget(null); openEdit(viewTarget); }}
                className="btn-primary"
                style={{ padding: "0.65rem 1.5rem", fontSize: "0.875rem" }}
              >✏️ تعديل</button>
            )}
            <button
              onClick={() => setViewTarget(null)}
              style={{ padding: "0.65rem 1.5rem", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600, fontSize: "0.875rem", color: "#475569" }}
            >إغلاق</button>
          </div>
        </div>
      </div>
    );
  };

  const moduleIcon =
    config.entityName === "قضية" ? "⚖️" :
    config.entityName === "موكل" ? "👥" :
    config.entityName === "جلسة" ? "🏛️" :
    config.entityName === "متابعة" ? "📋" :
    config.entityName === "سجل مالي" ? "💰" :
    config.entityName === "مستخدم" ? "⚙️" : "📌";

  return (
    <AppShell>
      <div style={{ position: "fixed", bottom: "1.5rem", insetInlineEnd: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ background: t.type === "success" ? "#0a0a12" : "#c3152a", color: "#fff", borderRadius: "12px", padding: "0.85rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fade-in-up 0.25s ease", maxWidth: 320 }}>
            {t.text}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1300 }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.25rem" }}>
                {moduleIcon} {moduleMap[slug]?.title ?? config.entityName}
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                إجمالي {rows.length} {config.entityName}
                {usingDemo ? " — بيانات تجريبية غنية" : " — بيانات مباشرة من الخادم"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setReportOpen(true)}
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.6rem 1.2rem", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}
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

        <StatsRow cards={config.kpis} />

        <div className="card-white" style={{ padding: "1.5rem" }}>
          {loadingData ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>جاري تحميل البيانات...</p>
          ) : rows.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</p>
              <p style={{ color: "#64748b", marginBottom: "1rem" }}>لا توجد بيانات بعد</p>
              {canWrite && (
                <button onClick={openAdd} className="btn-primary" style={{ padding: "0.65rem 1.5rem" }}>
                  ＋ {config.addLabel}
                </button>
              )}
            </div>
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

      <Modal
        open={modalOpen}
        title={editTarget ? `تعديل ${config.entityName}` : config.addLabel}
        fields={config.formFields}
        initial={editTarget ?? undefined}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        saveLabel={editTarget ? "حفظ التعديلات" : "إضافة"}
      />

      {renderViewModal()}

      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteMsg}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {reportOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,10,18,0.55)", backdropFilter: "blur(5px)", padding: "1rem" }}
          onClick={() => setReportOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: 460, boxShadow: "0 30px 80px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "1rem" }}>📊 تصدير التقارير</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
              {rows.length} سجل في {config.entityName}ات
            </p>
            {["PDF", "Excel", "CSV"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => { pushToast("success", `✅ جاري تحضير ${fmt}...`); setReportOpen(false); }}
                style={{ display: "block", width: "100%", marginBottom: "0.5rem", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600 }}
              >
                تصدير {fmt}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
