"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/lib/session";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type PageSettingsCategory,
  type PageSettingsStatus,
} from "@/lib/page-settings/types";

type CatalogPage = {
  pageKey: string;
  title: string;
  description: string;
  category: PageSettingsCategory;
  pageHref: string;
  settingsHref: string;
  status: PageSettingsStatus;
  icon: string;
  gapReason: string | null;
  canManage: boolean;
  saved: boolean;
  updatedAt: string | null;
};

type Coverage = {
  total: number;
  operational: number;
  partial: number;
  planned: number;
};

function ensureCss() {
  if (typeof document === "undefined") return;
  const existing = document.querySelector('link[data-page-settings-css]') as HTMLLinkElement | null;
  const href = "/erp-app/page-settings.css?v=page-settings-locked-contact-20261028a";
  if (existing) {
    if (existing.href.includes("page-settings-locked-contact-20261028a")) return;
    existing.href = href;
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-page-settings-css", "1");
  document.head.appendChild(link);
}

export function PageSettingsHub() {
  const { user, ready } = useSession(true);
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    ensureCss();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/page-settings?${params}`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "تعذر تحميل الإعدادات");
      }
      const data = await res.json();
      setPages(data.pages);
      setCoverage(data.coverage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }, [q, category, status]);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  const categories = useMemo(
    () => Object.entries(CATEGORY_LABELS) as Array<[PageSettingsCategory, string]>,
    []
  );

  if (!ready || !user) {
    return (
      <AppShell>
        <p style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>جاري التحميل...</p>
      </AppShell>
    );
  }

  if (user.role === "client") {
    return (
      <AppShell>
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <h1 style={{ fontWeight: 800 }}>غير مصرح</h1>
          <p style={{ color: "#64748b" }}>إعدادات الصفحات للموظفين المخوّلين فقط.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="psc-hub psc-hub-erp" dir="rtl">
        <div className="psc-erp-column">
          <div className="psc-erp-topbar">
            <Link href="/app/dashboard" className="psc-erp-top-btn">
              رجوع
            </Link>
            <button
              type="button"
              className="psc-erp-top-btn"
              onClick={() => setToolsOpen((v) => !v)}
              aria-expanded={toolsOpen}
            >
              بحث وفلاتر
            </button>
          </div>

          <div className="psc-erp-title-box">
            <h1>إعدادات الصفحات</h1>
          </div>
          <p className="psc-erp-lead">
            كل بند يفتح محرر إعدادات يُحفظ في PostgreSQL ويُطبَّق على الوظيفة المرتبطة.
          </p>

          {toolsOpen && (
            <div className="psc-erp-tools">
              {coverage && (
                <div className="psc-erp-stats" aria-label="إحصائيات التغطية">
                  <span>
                    <strong>{coverage.total}</strong> سجل
                  </span>
                  <span>
                    <strong>{coverage.operational}</strong> تشغيلية
                  </span>
                  <span>
                    <strong>{coverage.partial}</strong> جزئية
                  </span>
                  <span>
                    <strong>{coverage.planned}</strong> مخططة
                  </span>
                </div>
              )}
              <div className="psc-erp-filters">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="بحث عن صفحة..."
                  aria-label="بحث"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="التصنيف"
                >
                  <option value="all">كل الأقسام</option>
                  {categories.map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  aria-label="الحالة"
                >
                  <option value="all">كل الحالات</option>
                  {(Object.keys(STATUS_LABELS) as PageSettingsStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button type="button" className="psc-erp-filter-btn" onClick={load}>
                  تحديث
                </button>
              </div>
            </div>
          )}

          {error && <div className="psc-error">{error}</div>}

          {loading ? (
            <p className="psc-erp-loading">جاري التحميل...</p>
          ) : (
            <div className="psc-erp-list" role="list">
              {pages.map((p) => (
                <Link
                  key={p.pageKey}
                  href={p.settingsHref}
                  className="psc-erp-card"
                  role="listitem"
                >
                  <div className="psc-erp-card-title-row">
                    <h2>{p.title}</h2>
                    <span className={`psc-erp-status psc-erp-status-${p.status}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>
                  <p className="psc-erp-card-desc">{p.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
