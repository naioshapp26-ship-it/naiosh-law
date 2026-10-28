"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatsRow } from "@/components/ui/stats-row";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { moduleConfigMap } from "@/data/module-configs";
import { moduleMap } from "@/data/modules";
import { useSession, canWriteRole } from "@/lib/session";
import { getModuleApiEndpoint } from "@/lib/module-api";
import { extractAttachments, persistFormAttachments, stripAttachments } from "@/lib/form-attachments";
import { sendRecordToArchive, buildArchiveRef, buildArchiveTitle } from "@/lib/archive-client";
import { extractPartyFields, stripPartyFields, type PartyFields } from "@/lib/party-fields";
import { upsertRecordParties } from "@/lib/record-parties-client";
import { MODULE_LABELS } from "@/lib/archive-types";
import { RecordSupplementModal } from "@/components/record-supplement-modal";
import { saveRecordSupplement } from "@/lib/record-supplement-client";
import type { ArchiveAttachment } from "@/lib/archive-types";
import { pageSettingsMap } from "@/lib/page-settings/registry";
import {
  customFieldsToFormFields,
  type CustomFieldDef,
  type PageSectionDef,
} from "@/lib/page-settings/custom-field-types";
import {
  PageDynamicSections,
  recordScopedCustomFields,
  type SectionDataMap,
} from "@/components/page-settings/page-dynamic-sections";
import { RecordScopedSectionsPanel } from "@/components/page-settings/record-scoped-sections";
import {
  exportCsv,
  exportPdf,
  exportXlsx,
} from "@/lib/page-settings/export-reports";

type ToastMsg = { id: number; type: "success" | "error"; text: string };

type PageSettingsValues = {
  display?: {
    title?: string;
    subtitle?: string;
    showKpis?: boolean;
    pageSize?: number;
    visibleColumns?: string[];
  };
  actions?: {
    allowCreate?: boolean;
    allowView?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    allowArchive?: boolean;
    allowExport?: boolean;
  };
  permissions?: {
    canCreateRoles?: string[];
    canEditRoles?: string[];
    canDeleteRoles?: string[];
    canExportRoles?: string[];
    canManageSettingsRoles?: string[];
  };
  fields?: {
    hiddenOptionalFields?: string[];
    defaultStatus?: string;
  };
  workflow?: {
    statuses?: string[];
    initialStatus?: string;
  };
  customFields?: CustomFieldDef[];
  sections?: PageSectionDef[];
  sectionData?: SectionDataMap;
  reports?: {
    allowPdf?: boolean;
    allowExcel?: boolean;
    allowCsv?: boolean;
    showLogo?: boolean;
    headerText?: string;
    footerText?: string;
    paperOrientation?: string;
  };
};

function readPreviewDraft(slug: string): PageSettingsValues | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("settingsPreview") !== "1") return null;
    const raw = sessionStorage.getItem(`naiosh.pageSettings.preview.${slug}`);
    if (!raw) return null;
    return JSON.parse(raw) as PageSettingsValues;
  } catch {
    return null;
  }
}

let toastCounter = 0;

export function ModuleShell({ slug, embedded = false }: { slug: string; embedded?: boolean }) {
  const { user, ready } = useSession(true);
  const config = moduleConfigMap[slug];
  const apiEndpoint = getModuleApiEndpoint(slug);
  const fallbackData = config?.data ?? [];
  const settingsDef = pageSettingsMap[slug];

  const [rows, setRows] = useState<Record<string, unknown>[]>(fallbackData);
  const [loadingData, setLoadingData] = useState(!!apiEndpoint);
  const [usingDemo, setUsingDemo] = useState(!apiEndpoint);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null);
  const [viewTarget, setViewTarget] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Record<string, unknown> | null>(null);
  const [supplementTarget, setSupplementTarget] = useState<Record<string, unknown> | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [pageSettings, setPageSettings] = useState<PageSettingsValues | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [notesRecordId, setNotesRecordId] = useState<string | null>(null);

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
        if (Array.isArray(data)) {
          // Empty array is a real empty store — do not fall back to demo rows
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

  useEffect(() => {
    if (!settingsDef) return;
    let cancelled = false;
    (async () => {
      try {
        const draft = readPreviewDraft(slug);
        if (draft) {
          if (!cancelled) {
            setPageSettings(draft);
            setPreviewMode(true);
          }
          return;
        }
        const res = await fetch(`/api/page-settings/${encodeURIComponent(slug)}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) {
          setPageSettings((body.resolved?.values ?? null) as PageSettingsValues);
          setPreviewMode(false);
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, settingsDef]);

  const canWrite = user ? canWriteRole(user.role) : false;
  const role = user?.role ?? "";

  const sectionVisible = (kind: PageSectionDef["kind"]) => {
    const list = pageSettings?.sections;
    if (!list || list.length === 0) return true;
    const match = list.find((s) => s.kind === kind);
    if (!match) return true;
    return match.visible !== false;
  };

  const displayTitle =
    pageSettings?.display?.title?.trim() ||
    moduleMap[slug]?.title ||
    config?.entityName ||
    slug;
  const displaySubtitle =
    pageSettings?.display?.subtitle?.trim() ||
    (usingDemo ? "بيانات تجريبية غنية" : "بيانات مباشرة من الخادم");
  const showKpis =
    pageSettings?.display?.showKpis !== false && sectionVisible("kpis");
  const pageSize = pageSettings?.display?.pageSize ?? 10;
  const showTable = sectionVisible("table");
  const showActionsBar = sectionVisible("actions");

  /** Static module-config KPIs are illustrative — never present them as live DB metrics. */
  const kpiCards = useMemo(() => {
    if (!config?.kpis?.length) return [];
    if (usingDemo || loadingData) {
      return config.kpis.map((k) => ({
        ...k,
        delta: "أرقام توضيحية — ليست من قاعدة البيانات",
        deltaPos: true,
      }));
    }
    const total = rows.length;
    const active = rows.filter((r) => {
      const s = String((r as Record<string, unknown>).status ?? "");
      return s.includes("نشط") || s.toLowerCase() === "open" || s.toLowerCase() === "active";
    }).length;
    return config.kpis.map((k, i) => {
      if (i === 0) {
        return { ...k, value: total, delta: "حية من البيانات المعروضة", deltaPos: true };
      }
      if (i === 1) {
        return { ...k, value: active, delta: "حية من البيانات المعروضة", deltaPos: true };
      }
      return {
        ...k,
        delta: "توضيحي — العدد الفعلي في الجدول",
        deltaPos: true,
      };
    });
  }, [config?.kpis, usingDemo, loadingData, rows]);

  const recordCustomDefs = useMemo(
    () => recordScopedCustomFields(pageSettings?.customFields, pageSettings?.sections),
    [pageSettings?.customFields, pageSettings?.sections]
  );

  const visibleColumns = useMemo(() => {
    if (!config) return [];
    const keys = pageSettings?.display?.visibleColumns;
    const customDefs = recordCustomDefs;
    const baseCols =
      !keys || keys.length === 0
        ? config.columns
        : (() => {
            const set = new Set(keys);
            const filtered = config.columns.filter((c) => set.has(c.key));
            return filtered.length > 0 ? filtered : config.columns;
          })();
    const customCols = customDefs.map((f) => ({
      key: f.key,
      label: f.label,
      type: "text" as const,
    }));
    return [...baseCols, ...customCols];
  }, [config, pageSettings, recordCustomDefs]);

  const formFields = useMemo(() => {
    if (!config) return [];
    const hidden = new Set(pageSettings?.fields?.hiddenOptionalFields ?? []);
    const workflowStatuses = pageSettings?.workflow?.statuses;
    const base = config.formFields
      .filter((f) => !hidden.has(f.key))
      .map((f) => {
        if (f.key === "status" && f.type === "select" && workflowStatuses?.length) {
          return { ...f, options: workflowStatuses };
        }
        return f;
      });
    const custom = customFieldsToFormFields(recordCustomDefs);
    return [...base, ...custom];
  }, [config, pageSettings, recordCustomDefs]);

  const orderedSections = useMemo(() => {
    const list = Array.isArray(pageSettings?.sections) ? [...pageSettings!.sections!] : [];
    if (list.length === 0) {
      return [
        { id: "kpis", title: "kpis", kind: "kpis" as const, visible: true, order: 0 },
        { id: "table", title: "table", kind: "table" as const, visible: true, order: 1 },
      ];
    }
    return list
      .filter((s) => s && s.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [pageSettings?.sections]);

  const createInitial = useMemo(() => {
    const initialStatus =
      pageSettings?.fields?.defaultStatus?.trim() ||
      pageSettings?.workflow?.initialStatus?.trim() ||
      "";
    return initialStatus ? { status: initialStatus } : undefined;
  }, [pageSettings]);

  const actions = pageSettings?.actions;
  const perms = pageSettings?.permissions;
  const roleAllowed = (list?: string[]) => !list || list.includes(role);

  const allowCreate =
    canWrite &&
    actions?.allowCreate !== false &&
    roleAllowed(perms?.canCreateRoles);
  const allowEdit =
    canWrite &&
    actions?.allowEdit !== false &&
    roleAllowed(perms?.canEditRoles);
  const allowDelete =
    canWrite &&
    actions?.allowDelete !== false &&
    roleAllowed(perms?.canDeleteRoles);
  const allowArchive =
    canWrite &&
    actions?.allowArchive !== false &&
    roleAllowed(perms?.canDeleteRoles);
  const allowExport =
    actions?.allowExport !== false &&
    roleAllowed(perms?.canExportRoles);
  const canOpenSettings =
    Boolean(settingsDef) &&
    (perms?.canManageSettingsRoles
      ? perms.canManageSettingsRoles.includes(role)
      : settingsDef?.manageRoles.includes(role as never));

  if (!ready || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#101D32", animation: "spin-slow 0.9s linear infinite", margin: "0 auto 1rem" }} />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    const missing = (
      <div style={{ textAlign: "center", padding: "5rem", color: "#64748b" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>الوحدة غير موجودة</h2>
        <p>الرابط ({slug}) غير معرّف في النظام.</p>
      </div>
    );
    return embedded ? missing : <AppShell>{missing}</AppShell>;
  }

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (row: Record<string, unknown>) => { setEditTarget(row); setModalOpen(true); };

  const handleSave = async (data: Record<string, unknown>) => {
    const attachments = extractAttachments(data);
    const parties = extractPartyFields(data);
    const payload = stripPartyFields(stripAttachments(data));

    if (apiEndpoint && canWrite && !usingDemo) {
      try {
        let recordId = editTarget?.id ? String(editTarget.id) : "";
        if (editTarget?.id) {
          const res = await fetch(`${apiEndpoint}/${editTarget.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
          pushToast("success", `✅ تم تعديل ${config.entityName} بنجاح`);
        } else {
          const res = await fetch(apiEndpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
          const created = await res.json();
          recordId = String(created.id ?? "");
          pushToast("success", `✅ تمت إضافة ${config.entityName} جديد بنجاح`);
        }
        if (recordId && attachments.length) {
          await persistFormAttachments({
            sourceModule: slug,
            sourceId: recordId,
            sourceRef: buildArchiveRef({ ...payload, id: recordId }),
            title: buildArchiveTitle(payload, config.entityName),
            attachments,
          });
        }
        if (recordId) {
          await upsertRecordParties({
            sourceModule: slug,
            sourceId: recordId,
            sourceRef: buildArchiveRef({ ...payload, id: recordId }),
            parties,
          });
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

  const handleSupplementSave = async (
    data: {
      notes: string;
      attachments: ArchiveAttachment[];
    } & PartyFields
  ) => {
    if (!supplementTarget?.id) return;
    const result = await saveRecordSupplement({
      sourceModule: slug,
      sourceId: String(supplementTarget.id),
      sourceRef: buildArchiveRef(supplementTarget),
      title: buildArchiveTitle(supplementTarget, config.entityName),
      notes: data.notes,
      attachments: data.attachments,
    });
    if (!result.ok) {
      pushToast("error", result.message);
      return;
    }
    const { notes: _n, attachments: _a, ...parties } = data;
    void _n;
    void _a;
    await upsertRecordParties({
      sourceModule: slug,
      sourceId: String(supplementTarget.id),
      sourceRef: buildArchiveRef(supplementTarget),
      parties,
    });
    pushToast("success", result.message);
    setSupplementTarget(null);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget?.id) return;
    setArchiving(true);
    try {
      const result = await sendRecordToArchive({
        sourceModule: slug,
        sourceModuleLabel: MODULE_LABELS[slug] ?? moduleMap[slug]?.title ?? slug,
        sourceId: String(archiveTarget.id),
        title: buildArchiveTitle(archiveTarget, config.entityName),
        sourceRef: buildArchiveRef(archiveTarget),
        recordData: archiveTarget,
      });
      if (!result.ok) {
        pushToast("error", result.message);
      } else {
        pushToast("success", result.message);
        setRows((prev) =>
          prev.map((r) => (r.id === archiveTarget.id ? { ...r, status: "مؤرشف" } : r))
        );
        await loadRows();
      }
    } catch {
      pushToast("error", "فشل أرشفة السجل");
    } finally {
      setArchiving(false);
      setArchiveTarget(null);
    }
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

  const body = (
      <>
      <div style={{ position: "fixed", bottom: "1.5rem", insetInlineEnd: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ background: t.type === "success" ? "#0a0a12" : "#101D32", color: "#fff", borderRadius: "12px", padding: "0.85rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fade-in-up 0.25s ease", maxWidth: 320 }}>
            {t.text}
          </div>
        ))}
      </div>

      <div className="erp-page" style={{ width: "100%", maxWidth: "100%" }}>
        {previewMode && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 10,
              background: "linear-gradient(90deg,#101D32,#1a304d)",
              color: "#fff",
              border: "1px solid rgba(183,154,97,0.45)",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            معاينة إعدادات غير محفوظة — أغلق التبويب أو احفظ من محرر الإعدادات لتثبيت التغييرات.
          </div>
        )}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.25rem" }}>
                {moduleIcon} {displayTitle}
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                إجمالي {rows.length} {config.entityName} — {displaySubtitle}
              </p>
            </div>
            {showActionsBar && (
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
              {canOpenSettings && (
                <Link
                  href={`/app/page-settings/${slug}`}
                  style={{ background: "#101D32", color: "#fff", border: "1px solid #101D32", borderRadius: "10px", padding: "0.6rem 1.2rem", fontFamily: "var(--font-cairo)", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}
                >
                  ⚙️ إعدادات الصفحة
                </Link>
              )}
              {allowExport && (
                <button
                  onClick={() => setReportOpen(true)}
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.6rem 1.2rem", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}
                >
                  📊 تقارير
                </button>
              )}
              {allowCreate && (
                <button
                  onClick={openAdd}
                  className="btn-primary"
                  style={{ padding: "0.6rem 1.4rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  ＋ {config.addLabel}
                </button>
              )}
            </div>
            )}
          </div>
        </div>

        {orderedSections.map((sec) => {
          if (sec.kind === "kpis") {
            return showKpis ? <StatsRow key={sec.id} cards={kpiCards} /> : null;
          }
          if (sec.kind === "actions") {
            return null; // actions live in the header bar
          }
          if (sec.kind === "table") {
            if (!showTable) return null;
            return (
              <div key={sec.id} className="card-white" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                {loadingData ? (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>جاري تحميل البيانات...</p>
                ) : rows.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem" }}>
                    <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</p>
                    <p style={{ color: "#64748b", marginBottom: "1rem" }}>لا توجد بيانات بعد</p>
                    {allowCreate && (
                      <button onClick={openAdd} className="btn-primary" style={{ padding: "0.65rem 1.5rem" }}>
                        ＋ {config.addLabel}
                      </button>
                    )}
                  </div>
                ) : (
                  <DataTable
                    columns={visibleColumns}
                    data={rows}
                    pageSize={pageSize}
                    onView={actions?.allowView === false ? undefined : setViewTarget}
                    onEdit={allowEdit ? openEdit : undefined}
                    onSupplement={allowEdit && !usingDemo ? setSupplementTarget : undefined}
                    onArchive={allowArchive && !usingDemo ? setArchiveTarget : undefined}
                    onDelete={allowDelete ? setDeleteTarget : undefined}
                    searchPlaceholder={`بحث في ${config.entityName}ات...`}
                  />
                )}
              </div>
            );
          }
          if (sec.kind === "notes" || sec.kind === "custom") {
            const scope = sec.scope === "record" ? "record" : "page";
            if (scope === "record") {
              // Rendered once below via RecordScopedSectionsPanel
              return null;
            }
            return (
              <PageDynamicSections
                key={sec.id}
                pageKey={slug}
                sections={[sec]}
                customFields={pageSettings?.customFields}
                sectionData={pageSettings?.sectionData}
                canWrite={canWrite}
                includeBuiltins={false}
                onSaved={(next) =>
                  setPageSettings((prev) => (prev ? { ...prev, sectionData: next } : prev))
                }
              />
            );
          }
          return null;
        })}

        <RecordScopedSectionsPanel
          sections={pageSettings?.sections}
          customFields={pageSettings?.customFields}
          rows={rows}
          selectedId={notesRecordId}
          onSelectId={setNotesRecordId}
          canWrite={canWrite}
          entityName={config.entityName}
          apiEndpoint={apiEndpoint}
          onSavedRow={(id, patch) => {
            setRows((prev) =>
              prev.map((r) => (String(r.id) === String(id) ? { ...r, ...patch } : r))
            );
          }}
        />
      </div>

      <Modal
        open={modalOpen}
        title={editTarget ? `تعديل ${config.entityName}` : config.addLabel}
        fields={formFields}
        initial={editTarget ?? createInitial}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        saveLabel={editTarget ? "حفظ التعديلات" : "إضافة"}
      />

      {renderViewModal()}

      <RecordSupplementModal
        open={!!supplementTarget}
        recordRef={buildArchiveRef(supplementTarget ?? {}) ?? String(supplementTarget?.id ?? "")}
        recordTitle={buildArchiveTitle(supplementTarget ?? {}, config.entityName)}
        onSave={handleSupplementSave}
        onClose={() => setSupplementTarget(null)}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        title="تأكيد الأرشفة"
        message={`هل تريد نقل هذا ${config.entityName} إلى الأرشيف؟ سيظهر في صفحة الأرشيف ويُحدَّث وضعه إلى «مؤرشف».`}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
        loading={archiving}
        confirmLabel="أرشفة"
        confirmColor="#475569"
        icon="📦"
      />

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
            {(() => {
              const cols = visibleColumns.map((c) => ({ key: c.key, label: c.label }));
              const reports = pageSettings?.reports;
              const allowPdf = reports?.allowPdf !== false;
              const allowExcel = reports?.allowExcel !== false;
              const allowCsv = reports?.allowCsv !== false;
              const headerText =
                reports?.headerText?.trim() ||
                "NAIOSH Law — منظومة نايوش القانونية 360";
              const footerText =
                reports?.footerText?.trim() || "سري — للاستخدام الداخلي";
              const stamp = new Date().toISOString().slice(0, 10);
              const baseName = `${slug}-${stamp}`;
              const pageTitle = pageSettings?.display?.title?.trim() || config.entityName;
              const common = {
                title: pageTitle,
                columns: cols,
                rows,
                headerText,
                footerText,
                showLogo: reports?.showLogo !== false,
                paperOrientation: reports?.paperOrientation || "portrait",
                fileBase: baseName,
              };

              const assertExportAllowed = async () => {
                const res = await fetch("/api/exports/gate", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pageKey: slug }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  pushToast("error", j.error || "التصدير غير مسموح حسب الصلاحيات");
                  return false;
                }
                return true;
              };

              const runCsv = async () => {
                if (!(await assertExportAllowed())) return;
                exportCsv(common);
                pushToast("success", "✅ تم تنزيل CSV");
                setReportOpen(false);
              };
              const runExcel = async () => {
                if (!(await assertExportAllowed())) return;
                try {
                  await exportXlsx(common);
                  pushToast("success", "✅ تم تنزيل Excel (.xlsx)");
                  setReportOpen(false);
                } catch (e) {
                  pushToast("error", e instanceof Error ? e.message : "فشل تصدير Excel");
                }
              };
              const runPdf = async () => {
                if (!(await assertExportAllowed())) return;
                try {
                  await exportPdf(common);
                  pushToast("success", "✅ تم تنزيل PDF");
                  setReportOpen(false);
                } catch (e) {
                  pushToast("error", e instanceof Error ? e.message : "فشل تصدير PDF");
                }
              };

              return (
                <>
                  {allowPdf ? (
                    <button
                      type="button"
                      onClick={() => void runPdf()}
                      style={{ display: "block", width: "100%", marginBottom: "0.5rem", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600 }}
                    >
                      تنزيل PDF
                    </button>
                  ) : null}
                  {allowExcel ? (
                    <button
                      type="button"
                      onClick={() => void runExcel()}
                      style={{ display: "block", width: "100%", marginBottom: "0.5rem", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600 }}
                    >
                      تنزيل Excel (.xlsx)
                    </button>
                  ) : null}
                  {allowCsv ? (
                    <button
                      type="button"
                      onClick={() => void runCsv()}
                      style={{ display: "block", width: "100%", marginBottom: "0.5rem", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8f9fb", cursor: "pointer", fontFamily: "var(--font-cairo)", fontWeight: 600 }}
                    >
                      تنزيل CSV
                    </button>
                  ) : null}
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.75rem", lineHeight: 1.5 }}>
                    التصدير يطبّق الأعمدة الظاهرة والترويسة والشعار والتذييل واتجاه الورقة من إعدادات التقارير، مع فرض صلاحية التصدير من الخادم.
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      </>
  );

  if (embedded) return body;
  return <AppShell>{body}</AppShell>;
}
