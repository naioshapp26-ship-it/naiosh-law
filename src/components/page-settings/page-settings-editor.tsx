"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/lib/session";
import { getByPath, setByPath } from "@/lib/page-settings/defaults";
import { STATUS_LABELS, type SettingFieldDef, type SettingTabDef } from "@/lib/page-settings/types";

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

function ensureCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[data-page-settings-css]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/erp-app/page-settings.css?v=page-settings-20261027";
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
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    ensureCss();
  }, []);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  }, []);

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
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

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
          </div>
        </header>

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
          </>
        )}
      </div>
    </AppShell>
  );
}
