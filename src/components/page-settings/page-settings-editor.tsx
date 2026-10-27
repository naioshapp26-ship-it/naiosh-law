"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/lib/session";
import { getByPath, setByPath } from "@/lib/page-settings/defaults";
import { STATUS_LABELS, type SettingFieldDef, type SettingTabDef } from "@/lib/page-settings/types";
import type { CustomFieldDef, PageSectionDef } from "@/lib/page-settings/custom-field-types";

type DefinitionPayload = {
  pageKey: string;
  title: string;
  description: string;
  pageHref: string;
  status: "operational" | "partial" | "planned";
  icon: string;
  gapReason: string | null;
  tabs: SettingTabDef[];
};

type AuditRow = {
  id: string;
  action: string;
  scope: string;
  createdAt: string;
  changedBy: { name: string; email: string } | null;
};

type VersionRow = {
  id: string;
  version: number;
  label: string | null;
  createdAt: string;
};

const FIELD_TYPES: Array<{ value: CustomFieldDef["type"]; label: string }> = [
  { value: "text", label: "نص" },
  { value: "number", label: "رقم" },
  { value: "date", label: "تاريخ" },
  { value: "select", label: "قائمة اختيار" },
  { value: "textarea", label: "نص طويل" },
  { value: "checkbox", label: "نعم/لا" },
];

function ensureCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[data-page-settings-css]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/erp-app/page-settings.css?v=page-settings-erp-ref-20261027c";
  link.setAttribute("data-page-settings-css", "1");
  document.head.appendChild(link);
}

function FieldControl({
  field,
  value,
  disabled,
  onChange,
}: {
  field: SettingFieldDef;
  value: unknown;
  disabled: boolean;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="psc-check-row">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled || field.locked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{Boolean(value) ? "مفعّل" : "متوقف"}</span>
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={Number(value ?? 0)}
        min={field.min}
        max={field.max}
        disabled={disabled || field.locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={String(value ?? "")}
        disabled={disabled || field.locked}
        onChange={(e) => onChange(e.target.value)}
      >
        {(field.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "multi-select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="psc-multi">
        {(field.options ?? []).map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={`psc-chip${on ? " on" : ""}`}
              disabled={disabled || field.locked}
              onClick={() => {
                if (on) onChange(selected.filter((x) => x !== o.value));
                else onChange([...selected, o.value]);
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "string-list") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <textarea
        rows={4}
        disabled={disabled || field.locked}
        value={list.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
        placeholder="سطر لكل قيمة"
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? "")}
      disabled={disabled || field.locked}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function asCustomFields(raw: unknown): CustomFieldDef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x, i) => ({
      key: String(x.key ?? `cf_${i}`),
      label: String(x.label ?? ""),
      type: (String(x.type ?? "text") as CustomFieldDef["type"]),
      required: Boolean(x.required),
      options: Array.isArray(x.options) ? x.options.map(String) : [],
      placeholder: x.placeholder != null ? String(x.placeholder) : undefined,
      order: Number(x.order ?? i),
      visible: x.visible !== false,
      sectionId: x.sectionId != null && String(x.sectionId).trim() ? String(x.sectionId) : undefined,
      storage:
        x.storage === "page" || x.storage === "record"
          ? (x.storage as CustomFieldDef["storage"])
          : undefined,
    }));
}

function asSections(raw: unknown): PageSectionDef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x, i) => ({
      id: String(x.id ?? `sec_${i}`),
      title: String(x.title ?? ""),
      kind: (String(x.kind ?? "custom") as PageSectionDef["kind"]),
      visible: x.visible !== false,
      order: Number(x.order ?? i),
    }));
}

export function PageSettingsEditor({ pageKey }: { pageKey: string }) {
  const { user, ready } = useSession(true);
  const [def, setDef] = useState<DefinitionPayload | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [defaults, setDefaults] = useState<Record<string, unknown>>({});
  const [canManage, setCanManage] = useState(false);
  const [tabId, setTabId] = useState<string>("display");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const customFields = asCustomFields(values.customFields);
  const sections = asSections(values.sections);

  useEffect(() => {
    ensureCss();
  }, []);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadVersions = useCallback(async () => {
    const res = await fetch(`/api/page-settings/${encodeURIComponent(pageKey)}/versions`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const body = await res.json();
    setVersions(body.versions ?? []);
  }, [pageKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/page-settings/${encodeURIComponent(pageKey)}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "تعذر التحميل");
      setDef(body.definition);
      setValues(body.resolved?.values ?? body.defaults ?? {});
      setDefaults(body.defaults ?? {});
      setCanManage(Boolean(body.canManage));
      setTabId(body.definition?.tabs?.[0]?.id ?? "display");
      setDirty(false);

      if (body.canManage) {
        const aRes = await fetch(`/api/page-settings/${encodeURIComponent(pageKey)}/audit?limit=12`, {
          credentials: "include",
        });
        if (aRes.ok) {
          const aBody = await aRes.json();
          setAudits(aBody.audits ?? []);
        }
        await loadVersions();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }, [pageKey, loadVersions]);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  const activeTab = useMemo(
    () => def?.tabs.find((t) => t.id === tabId) ?? def?.tabs[0],
    [def, tabId]
  );

  const updateField = (field: SettingFieldDef, next: unknown) => {
    setValues((prev) => setByPath(prev, field.path, next));
    setDirty(true);
  };

  const setCustomFields = (next: CustomFieldDef[]) => {
    setValues((prev) => ({ ...prev, customFields: next }));
    setDirty(true);
  };

  const setSections = (next: PageSectionDef[]) => {
    setValues((prev) => ({ ...prev, sections: next }));
    setDirty(true);
  };

  const save = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/page-settings/${encodeURIComponent(pageKey)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "global", values }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "فشل الحفظ");
      setValues(body.resolved?.values ?? values);
      setDirty(false);
      showToast("success", "تم حفظ الإعدادات في قاعدة البيانات");
      await load();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/page-settings/${encodeURIComponent(pageKey)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "global", reset: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "فشل الاستعادة");
      setValues(body.resolved?.values ?? defaults);
      setDirty(false);
      showToast("success", "تمت استعادة القيم الافتراضية");
      await load();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل الاستعادة");
    } finally {
      setSaving(false);
    }
  };

  const restoreVersion = async (versionId: string) => {
    if (!canManage) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/page-settings/${encodeURIComponent(pageKey)}/versions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "فشل استعادة النسخة");
      setValues(body.resolved?.values ?? values);
      setDirty(false);
      showToast("success", "تمت استعادة النسخة السابقة بأمان");
      await load();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل الاستعادة");
    } finally {
      setSaving(false);
    }
  };

  const openPreview = () => {
    if (!def?.pageHref) return;
    try {
      sessionStorage.setItem(
        `naiosh.pageSettings.preview.${pageKey}`,
        JSON.stringify(values)
      );
    } catch {
      /* ignore */
    }
    setPreviewing(true);
    window.open(`${def.pageHref}?settingsPreview=1`, "_blank", "noopener,noreferrer");
  };

  const addCustomField = () => {
    const n = customFields.length + 1;
    const targetSection =
      sections.find((s) => (s.kind === "custom" || s.kind === "notes") && s.visible !== false) ||
      sections.find((s) => s.kind === "custom" || s.kind === "notes");
    setCustomFields([
      ...customFields,
      {
        key: `cf_field_${Date.now().toString(36)}`,
        label: `حقل مخصص ${n}`,
        type: "textarea",
        required: false,
        order: customFields.length,
        visible: true,
        options: [],
        sectionId: targetSection?.id,
        storage: targetSection ? "page" : "record",
      },
    ]);
  };

  const addSection = () => {
    const n = sections.filter((s) => s.kind === "custom" || s.kind === "notes").length + 1;
    setSections([
      ...sections,
      {
        id: `custom_${Date.now().toString(36)}`,
        title: `ملاحظات ${n}`,
        kind: "custom",
        visible: true,
        order: sections.length,
      },
    ]);
  };

  if (!ready || !user) {
    return (
      <AppShell>
        <p style={{ padding: "3rem", textAlign: "center" }}>جاري التحميل...</p>
      </AppShell>
    );
  }

  if (user.role === "client") {
    return (
      <AppShell>
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <h1>غير مصرح</h1>
        </div>
      </AppShell>
    );
  }

  const showBuilder = tabId === "fields" || tabId === "display";

  return (
    <AppShell>
      <div className="psc-editor" dir="rtl">
        {toast && <div className={`psc-toast ${toast.type}`}>{toast.message}</div>}

        <header className="psc-editor-header">
          <div>
            <p className="psc-eyebrow">إعدادات الصفحة {def?.icon}</p>
            <h1>{def?.title ?? pageKey}</h1>
            <p className="psc-lead">{def?.description}</p>
            {def && (
              <p className="psc-meta" style={{ marginTop: 8 }}>
                الحالة: {STATUS_LABELS[def.status]}
                {def.gapReason ? ` — ${def.gapReason}` : ""}
              </p>
            )}
          </div>
          <div className="psc-actions">
            <Link href="/app/page-settings" className="psc-btn ghost">
              مركز الإعدادات
            </Link>
            {def?.pageHref && (
              <Link href={def.pageHref} className="psc-btn ghost">
                الصفحة الأصلية
              </Link>
            )}
            <button
              type="button"
              className="psc-btn gold"
              disabled={!def?.pageHref}
              onClick={openPreview}
            >
              معاينة
            </button>
          </div>
        </header>

        {previewing && (
          <div className="psc-preview-banner">
            <span>وضع المعاينة: المسودة في جلسة المتصفح — احفظ لتثبيتها في PostgreSQL.</span>
            <button type="button" className="psc-btn ghost" style={{ color: "#fff", borderColor: "#b79a61" }} onClick={() => setPreviewing(false)}>
              إخفاء
            </button>
          </div>
        )}

        {error && <div className="psc-error">{error}</div>}
        {loading || !def ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>جاري تحميل الإعدادات...</p>
        ) : (
          <>
            <div className="psc-tabs" role="tablist">
              {def.tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab?.id === t.id}
                  className={`psc-tab${activeTab?.id === t.id ? " active" : ""}`}
                  onClick={() => setTabId(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="psc-panel">
              <div className="psc-fields">
                {(activeTab?.fields ?? []).map((f) => (
                  <div key={f.path} className="psc-field">
                    <label>
                      {f.label}
                      {f.locked ? <span className="locked"> · مقفل قانونياً</span> : null}
                    </label>
                    <FieldControl
                      field={f}
                      value={getByPath(values, f.path)}
                      disabled={!canManage}
                      onChange={(v) => updateField(f, v)}
                    />
                    {f.description ? <p className="hint">{f.description}</p> : null}
                  </div>
                ))}

                {tabId === "fields" && (
                  <div className="psc-field">
                    <label>الحقول المخصصة (سجل أو قسم صفحة)</label>
                    <p className="hint">
                      اربط الحقل بقسم No-Code ليظهر داخل القسم في الصفحة الأصلية ويُحفظ في PostgreSQL
                      (مستوى الصفحة)، أو اتركه بلا قسم ليظهر في نموذج السجل/الجدول.
                    </p>
                    <div className="psc-builder">
                      {customFields.map((cf, idx) => (
                        <div key={cf.key} className="psc-builder-row">
                          <input
                            value={cf.label}
                            disabled={!canManage}
                            placeholder="اسم الحقل"
                            onChange={(e) => {
                              const next = [...customFields];
                              next[idx] = { ...cf, label: e.target.value };
                              setCustomFields(next);
                            }}
                          />
                          <select
                            value={cf.type}
                            disabled={!canManage}
                            onChange={(e) => {
                              const next = [...customFields];
                              next[idx] = {
                                ...cf,
                                type: e.target.value as CustomFieldDef["type"],
                              };
                              setCustomFields(next);
                            }}
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={cf.sectionId ?? ""}
                            disabled={!canManage}
                            title="القسم"
                            onChange={(e) => {
                              const sectionId = e.target.value || undefined;
                              const sec = sections.find((s) => s.id === sectionId);
                              const next = [...customFields];
                              next[idx] = {
                                ...cf,
                                sectionId,
                                storage:
                                  sec && (sec.kind === "custom" || sec.kind === "notes")
                                    ? "page"
                                    : sectionId
                                      ? cf.storage
                                      : "record",
                              };
                              setCustomFields(next);
                            }}
                          >
                            <option value="">نموذج السجل (بدون قسم)</option>
                            {sections
                              .filter((s) => s.kind === "custom" || s.kind === "notes")
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  قسم: {s.title}
                                </option>
                              ))}
                          </select>
                          <input
                            value={(cf.options ?? []).join("، ")}
                            disabled={!canManage || cf.type !== "select"}
                            placeholder="خيارات القائمة (مفصولة بفاصلة)"
                            onChange={(e) => {
                              const next = [...customFields];
                              next[idx] = {
                                ...cf,
                                options: e.target.value
                                  .split(/[,،]/)
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              };
                              setCustomFields(next);
                            }}
                          />
                          <label className="psc-check-row">
                            <input
                              type="checkbox"
                              checked={Boolean(cf.required)}
                              disabled={!canManage}
                              onChange={(e) => {
                                const next = [...customFields];
                                next[idx] = { ...cf, required: e.target.checked };
                                setCustomFields(next);
                              }}
                            />
                            إلزامي
                          </label>
                          <label className="psc-check-row">
                            <input
                              type="checkbox"
                              checked={cf.visible !== false}
                              disabled={!canManage}
                              onChange={(e) => {
                                const next = [...customFields];
                                next[idx] = { ...cf, visible: e.target.checked };
                                setCustomFields(next);
                              }}
                            />
                            ظاهر
                          </label>
                          <button
                            type="button"
                            className="psc-btn danger"
                            disabled={!canManage}
                            onClick={() =>
                              setCustomFields(customFields.filter((_, i) => i !== idx))
                            }
                          >
                            إزالة من التصميم
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="psc-btn primary"
                        disabled={!canManage}
                        onClick={addCustomField}
                      >
                        ＋ إضافة حقل مخصص
                      </button>
                    </div>
                  </div>
                )}

                {tabId === "display" && (
                  <div className="psc-field">
                    <label>أقسام الصفحة (إظهار / إخفاء / ترتيب)</label>
                    <p className="hint">
                      الأقسام المخصصة وقسم الملاحظات تظهر فعليًا في الصفحة الأصلية بعد الحفظ، مع حقول قابلة
                      للتعبئة. إخفاء القسم لا يحذف بيانات القضايا أو الموكلين. حذف قسم مخصص يزيل التصميم فقط.
                    </p>
                    <div className="psc-builder">
                      {sections
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((sec, idx) => (
                          <div key={sec.id} className="psc-section-row">
                            <input
                              value={sec.title}
                              disabled={!canManage}
                              onChange={(e) => {
                                const next = sections.map((s) =>
                                  s.id === sec.id ? { ...s, title: e.target.value } : s
                                );
                                setSections(next);
                              }}
                            />
                            <span className="psc-meta">{sec.kind} · {sec.id}</span>
                            <label className="psc-check-row">
                              <input
                                type="checkbox"
                                checked={sec.visible !== false}
                                disabled={!canManage}
                                onChange={(e) => {
                                  setSections(
                                    sections.map((s) =>
                                      s.id === sec.id ? { ...s, visible: e.target.checked } : s
                                    )
                                  );
                                }}
                              />
                              ظاهر
                            </label>
                            <button
                              type="button"
                              className="psc-btn ghost"
                              disabled={!canManage || idx === 0}
                              onClick={() => {
                                const sorted = sections.slice().sort((a, b) => a.order - b.order);
                                if (idx === 0) return;
                                const a = sorted[idx - 1];
                                const b = sorted[idx];
                                const orderA = a.order;
                                setSections(
                                  sections.map((s) => {
                                    if (s.id === a.id) return { ...s, order: b.order };
                                    if (s.id === b.id) return { ...s, order: orderA };
                                    return s;
                                  })
                                );
                              }}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="psc-btn ghost"
                              disabled={!canManage}
                              onClick={() => {
                                if (sec.kind !== "custom") {
                                  setSections(
                                    sections.map((s) =>
                                      s.id === sec.id ? { ...s, visible: false } : s
                                    )
                                  );
                                  return;
                                }
                                setSections(sections.filter((s) => s.id !== sec.id));
                              }}
                            >
                              {sec.kind === "custom" ? "حذف من التصميم" : "إخفاء"}
                            </button>
                          </div>
                        ))}
                      <button
                        type="button"
                        className="psc-btn primary"
                        disabled={!canManage}
                        onClick={addSection}
                      >
                        ＋ إضافة قسم مدعوم
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="psc-footer-bar">
                <button
                  type="button"
                  className="psc-btn gold"
                  disabled={!canManage || saving || !dirty}
                  onClick={save}
                >
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
                <button
                  type="button"
                  className="psc-btn ghost"
                  disabled={!canManage || saving || !dirty}
                  onClick={() => {
                    setValues(defaults);
                    setDirty(false);
                  }}
                >
                  إلغاء التعديلات
                </button>
                <button
                  type="button"
                  className="psc-btn ghost"
                  disabled={!def.pageHref}
                  onClick={openPreview}
                >
                  معاينة
                </button>
                <button
                  type="button"
                  className="psc-btn danger"
                  disabled={!canManage || saving}
                  onClick={resetDefaults}
                >
                  استعادة الافتراضي
                </button>
                {!canManage && (
                  <span className="psc-meta">عرض فقط — ليست لديك صلاحية التعديل</span>
                )}
              </div>
            </div>

            {versions.length > 0 && (
              <div className="psc-audit">
                <h3>نسخ الإعدادات السابقة (استعادة آمنة)</h3>
                <div className="psc-versions">
                  {versions.map((v) => (
                    <div key={v.id} className="psc-version-row">
                      <span>
                        v{v.version} — {v.label ?? "نسخة"} —{" "}
                        {new Date(v.createdAt).toLocaleString("ar")}
                      </span>
                      <button
                        type="button"
                        className="psc-btn ghost"
                        disabled={!canManage || saving}
                        onClick={() => restoreVersion(v.id)}
                      >
                        استعادة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {audits.length > 0 && (
              <div className="psc-audit">
                <h3>سجل التدقيق</h3>
                <ul>
                  {audits.map((a) => (
                    <li key={a.id}>
                      {new Date(a.createdAt).toLocaleString("ar")} — {a.action} ({a.scope})
                      {a.changedBy ? ` — ${a.changedBy.name}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showBuilder && (
              <p className="psc-meta" style={{ marginTop: "1rem" }}>
                ملاحظة أمان: حذف قسم من التصميم ≠ حذف سجل أعمال. ضوابط بيانات الموكلين والقواعد القانونية
                المقفلة لا يمكن تعطيلها من هنا.
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
