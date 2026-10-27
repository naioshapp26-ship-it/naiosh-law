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

const STATUS_COLORS: Record<PageSettingsStatus, { bg: string; fg: string }> = {
  operational: { bg: "rgba(22,163,74,0.12)", fg: "#15803d" },
  partial: { bg: "rgba(183,154,97,0.18)", fg: "#8a7340" },
  planned: { bg: "rgba(100,116,139,0.14)", fg: "#475569" },
};

function ensureCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[data-page-settings-css]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/erp-app/page-settings.css?v=page-settings-20261027b";
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
      <div className="psc-hub" dir="rtl">
        <header className="psc-hub-header">
          <div>
            <p className="psc-eyebrow">NAIOSH Law 360 · مركز التحكم بدون برمجة</p>
            <h1>إعدادات الصفحات</h1>
            <p className="psc-lead">
              قائمة بكل صفحات النظام — اضغط على اسم الصفحة لفتح إعداداتها الكاملة. التغييرات تُحفظ في
              PostgreSQL وتُطبَّق فورًا على الصفحة الأصلية.
            </p>
          </div>
          <div className="psc-actions">
            <Link href="/app/dashboard" className="psc-btn ghost">
              رجوع
            </Link>
            <Link href="/app/system-settings" className="psc-btn ghost">
              إعدادات الهوية
            </Link>
          </div>
        </header>

        {coverage && (
          <div className="psc-coverage">
            <div>
              <strong>{coverage.total}</strong>
              <span>إجمالي الصفحات في السجل</span>
            </div>
            <div>
              <strong>{coverage.operational}</strong>
              <span>تشغيلية بالكامل</span>
            </div>
            <div>
              <strong>{coverage.partial}</strong>
              <span>جزئية</span>
            </div>
            <div>
              <strong>{coverage.planned}</strong>
              <span>مخططة / غير منفذة كصفحة مستقلة</span>
            </div>
          </div>
        )}

        <div className="psc-filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث سريع عن صفحة..."
            aria-label="بحث"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="التصنيف">
            <option value="all">كل الأقسام</option>
            {categories.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="الحالة">
            <option value="all">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as PageSettingsStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button type="button" className="psc-btn primary" onClick={load}>
            تحديث
          </button>
        </div>

        {error && <div className="psc-error">{error}</div>}
        {loading ? (
          <p style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>جاري التحميل...</p>
        ) : (
          <div className="psc-list" role="list">
            {pages.map((p) => {
              const colors = STATUS_COLORS[p.status];
              return (
                <article key={p.pageKey} className="psc-card" role="listitem">
                  <div className="psc-card-main">
                    <div className="psc-card-top">
                      <span className="psc-icon" aria-hidden>
                        {p.icon}
                      </span>
                      <div className="psc-card-title">
                        <h2>
                          <Link href={p.settingsHref}>{p.title}</Link>
                        </h2>
                        <span className="psc-status" style={{ background: colors.bg, color: colors.fg }}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </div>
                    </div>
                    <p className="psc-desc">{p.description}</p>
                    <p className="psc-meta">
                      {CATEGORY_LABELS[p.category]} · {p.pageKey}
                      {p.saved ? " · محفوظة في قاعدة البيانات" : " · قيم افتراضية"}
                    </p>
                    {p.gapReason && p.status !== "operational" && (
                      <p className="psc-gap">{p.gapReason}</p>
                    )}
                  </div>
                  <div className="psc-card-actions">
                    <Link href={p.settingsHref} className="psc-btn primary">
                      فتح الإعدادات
                    </Link>
                    <Link href={p.pageHref} className="psc-btn ghost">
                      الصفحة
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
