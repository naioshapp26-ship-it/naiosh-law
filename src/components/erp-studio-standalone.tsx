"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ErpPageConfig } from "@/data/erp-page-catalog";
import { DarkModeToggle } from "@/components/color-mode";
import { Modal } from "@/components/ui/modal";
import { PageHero } from "@/components/page-hero";
import { defaultLabeledCreateFields } from "@/lib/form-field-labels";

const STUDIO_ICONS = [
  "fa-chart-pie",
  "fa-calendar-plus",
  "fa-layer-group",
  "fa-video",
  "fa-photo-film",
  "fa-scissors",
  "fa-film",
  "fa-share-nodes",
  "fa-circle-dot",
] as const;

function useStudioCss() {
  useEffect(() => {
    document.body.classList.add("erp-studio-standalone");
    if (!document.querySelector('link[data-erp-studio]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/erp-app/studio.css?v=dark-contrast-20261026";
      link.setAttribute("data-erp-studio", "1");
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[data-erp-page-hero]')) {
      const hero = document.createElement("link");
      hero.rel = "stylesheet";
      hero.href = "/erp-app/page-hero.css?v=unify-page-hero-20261031b";
      hero.setAttribute("data-erp-page-hero", "1");
      document.head.appendChild(hero);
    }
    return () => {
      document.body.classList.remove("erp-studio-standalone");
    };
  }, []);
}

/** Full-page studio matching ERP standalone HTML (no Law sidebar). */
export function ErpStudioStandalone({ config }: { config: ErpPageConfig }) {
  useStudioCss();
  const [active, setActive] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const isMarketing = config.icon === "fa-bullhorn";
  const tabs = config.tabs ?? [];
  const createLabel = isMarketing ? "حملة جديدة" : "فعالية جديدة";
  const addLabel = isMarketing ? "إضافة حملة" : "إضافة فعالية";
  const entityTitle = isMarketing ? "حملة" : "فعالية";
  const fields = useMemo(() => defaultLabeledCreateFields(entityTitle), [entityTitle]);

  return (
    <div className="erp-studio-page min-h-screen" dir="rtl">
      <div className="fixed top-4 left-4 z-50">
        <DarkModeToggle />
      </div>

      <div
        className="erp-studio-container p-4 md:p-6 space-y-5"
        style={{
          width: "100%",
          maxWidth: "80rem",
          marginLeft: "auto",
          marginRight: "auto",
          boxSizing: "border-box",
        }}
      >
        <PageHero
          icon={<i className={`fas ${isMarketing ? "fa-bullhorn" : "fa-clapperboard"}`} aria-hidden />}
          eyebrow={isMarketing ? "استديو الحملات التسويقية" : "استوديو الفعاليات"}
          title={config.title}
          subtitle={config.subtitle}
          actions={
            <>
              <button type="button" className="btn btn-primary text-sm" onClick={() => setAddOpen(true)}>
                <i className="fas fa-plus" /> {createLabel}
              </button>
              <button type="button" className="text-sm" style={{ padding: "0.55rem 1rem", borderRadius: 12, fontWeight: 700 }}>
                <i className="fas fa-video text-xs" /> رفع محتوى
              </button>
              <Link href="/app/dashboard" className="text-sm no-underline" style={{ padding: "0.55rem 1rem", borderRadius: 12, fontWeight: 700 }}>
                <i className="fas fa-arrow-right text-xs" /> رجوع للوحة التحكم
              </Link>
            </>
          }
        />

        <nav className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`nav-tab nav-tile ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
            >
              <i className={`fas ${STUDIO_ICONS[i] || "fa-circle"}`} aria-hidden />
              {tab}
            </button>
          ))}
        </nav>

        <section className="section active panel p-6">
          <div className="section-header">
            <div className="section-header-main">
              <div className="section-icon">
                <i className="fas fa-chart-pie" aria-hidden />
              </div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>ملخص الاستوديو</h2>
            </div>
            <button type="button" className="btn btn-primary section-add-btn" onClick={() => setAddOpen(true)}>
              <i className="fas fa-plus" /> {addLabel}
            </button>
          </div>

          <div className="info-banner">
            <i className="fas fa-circle-info" aria-hidden />
            <span>
              هذه اللوحة تمنحك نظرة سريعة على {isMarketing ? "الحملات" : "الفعاليات"} والمقاطع المسجلة
              لتسهيل تجهيز الريلز والنشر.
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {(config.kpis ?? []).map((kpi, i) => (
              <div
                key={kpi.label}
                className={`stat-card border-t-4 ${
                  i === 0
                    ? "border-red-500"
                    : i === 1
                      ? "border-amber-500"
                      : i === 2
                        ? "border-emerald-500"
                        : "border-indigo-500"
                }`}
              >
                <p className="text-xs text-slate-500 font-bold mb-2 m-0">{kpi.label}</p>
                <p className="text-3xl font-black text-slate-800 m-0">{kpi.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal
        open={addOpen}
        title={`إضافة ${entityTitle}`}
        fields={fields}
        onSave={() => setAddOpen(false)}
        onClose={() => setAddOpen(false)}
        saveLabel="إضافة"
        filesLabel="شواهد وملفات القضية (مستند · صورة · فيديو)"
      />
    </div>
  );
}
