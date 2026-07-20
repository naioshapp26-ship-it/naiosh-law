"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSiteTheme } from "@/components/theme-provider";
import { isHeroVideoSrc } from "@/lib/hero-media";
import { LANDING_SPECIALTIES, specialtyHref } from "@/data/landing-specialties";

const SIDE_RAIL = LANDING_SPECIALTIES.map((item) => ({
  label: item.label,
  href: specialtyHref(item.slug),
  active: item.slug === "profile",
}));

const OFFICE_PAGES = [
  { label: "لوحة التحكم", href: "/app/dashboard" },
  { label: "المكتبة القانونية", href: "/app/legal-library" },
  { label: "المالية القانونية", href: "/app/legal-finance" },
  { label: "الأرشيف", href: "/app/archive", nested: true },
  { label: "الإدارة والصلاحيات", href: "/app/modules/administration", nested: true },
];

const CTA_BUTTONS = [
  { label: "ابدأ الآن مجانًا", href: "/login", primary: true },
  { label: "دخول النظام", href: "/login", primary: false },
  { label: "عرض الوحدات", href: "/#modules", primary: false },
  { label: "طلب عرض تجريبي", href: "/#demo-request", primary: false },
];

const STATS = [
  { value: "99.9%", label: "وقت التشغيل" },
  { value: "+500", label: "موكل مسجل" },
  { value: "17", label: "وحدة تشغيلية" },
];

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

/**
 * Hero matching NAIOSH ERP `/newhome` chrome with NAIOSH Law content/data.
 */
export function EmpireLandingHero() {
  const { heroBannerSrc, theme, logoSrc } = useSiteTheme();
  const [libraryMedia, setLibraryMedia] = useState<{ type: string; url: string }[]>([]);
  const [slide, setSlide] = useState(0);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/homepage-hero-media/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setLibraryMedia(items.map((i: { type: string; url: string }) => ({ type: i.type, url: i.url })));
      })
      .catch(() => {
        if (!cancelled) setLibraryMedia([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!theme.heroAutoplaySlider || libraryMedia.length < 2) return;
    const t = window.setInterval(() => {
      setSlide((s) => (s + 1) % libraryMedia.length);
    }, 6000);
    return () => window.clearInterval(t);
  }, [theme.heroAutoplaySlider, libraryMedia.length]);

  const activeLibrary = libraryMedia[slide] || libraryMedia[0] || null;
  const preferredKind = theme.heroActiveType;
  const preferred = libraryMedia.find((m) => m.type === preferredKind) || activeLibrary;
  const displaySrc = preferred?.url || heroBannerSrc || "/newhome/booking-workspace.svg";
  const isVideo = preferred
    ? preferred.type === "video"
    : isHeroVideoSrc(heroBannerSrc, theme.heroMediaKind);
  const hasMedia = Boolean(displaySrc);
  const logo = logoSrc || "/naiosh-logo.png";

  const floatTitle = useMemo(() => {
    if (isVideo && theme.heroActiveVideoCaption) return theme.heroActiveVideoCaption;
    if (!isVideo && theme.heroActiveImageCaption) return theme.heroActiveImageCaption;
    return "الذكاء القانوني في مكتبك — شاهد العرض";
  }, [isVideo, theme.heroActiveImageCaption, theme.heroActiveVideoCaption]);

  const floatDesc = theme.heroActiveVideoDescription || "";

  const heroClass = [
    "hero",
    hasMedia && isVideo ? "hero-has-video" : "",
    hasMedia && !isVideo ? "hero-has-image" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={heroClass} aria-label="قسم الهيرو الرئيسي">
      <div className="hero-ambient" aria-hidden="true">
        <div className="hero-gradient-mesh" />
        <div className="hero-glow hero-glow--one" />
        <div className="hero-glow hero-glow--two" />
        <div className="hero-particles" id="hero-particles">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="hero-particle"
              style={{
                width: 3 + (i % 4),
                height: 3 + (i % 4),
                top: `${8 + ((i * 17) % 80)}%`,
                left: `${6 + ((i * 23) % 88)}%`,
                opacity: 0.25 + (i % 5) * 0.1,
                animation: `premiumGlowFloat ${10 + (i % 6)}s ease-in-out ${i * 0.35}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <span className="hero-orb orb-one" aria-hidden="true" />

      <div className="hero-media-layer" aria-hidden="true">
        {!isVideo && hasMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img id="hero-bg-img" src={displaySrc} alt="" loading="lazy" />
        ) : null}
        {isVideo && hasMedia ? (
          <video id="hero-bg-video-bg" src={displaySrc} autoPlay muted loop playsInline preload="auto" />
        ) : null}
      </div>

      <main className="container hero-inner">
        <div className="hero-content">
          <h1 className="hero-heading-white">إدارة القضايا والموكلين بذكاء لا مثيل له</h1>
          <p>
            منصة احترافية لمكاتب المحاماة تضم 17 وحدة تشغيلية مترابطة — من إدارة القضايا والجلسات
            وحتى المحاسبة القانونية والذكاء الاصطناعي.
          </p>
          <div className="hero-ctas">
            {CTA_BUTTONS.map((btn) => (
              <Link
                key={btn.label}
                className={`btn hero-cta-pill magnetic-btn${btn.primary ? " btn-primary" : " btn-secondary"}`}
                href={btn.href}
                style={
                  btn.primary
                    ? undefined
                    : {
                        background: "rgba(0,0,0,0.28)",
                        border: "1px solid rgba(255,255,255,0.55)",
                        color: "#fff",
                      }
                }
              >
                {btn.label}
              </Link>
            ))}
          </div>
          <div className="hero-stats" aria-label="إحصائيات سريعة">
            {STATS.map((s) => (
              <StatBox key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>

        <div className="hero-media-stack">
          <div className="hero-media-frame">
            <div className="hero-visual premium-video-frame" role="img" aria-label="مساحة عرض النظام">
              <div className="hero-visual-shine" aria-hidden="true" />
              <div className="hero-visual-reflection" aria-hidden="true" />
              <div className="hero-visual-media" aria-hidden={!hasMedia}>
                {hasMedia && isVideo ? (
                  <video
                    id="hero-bg-video"
                    key={displaySrc}
                    src={displaySrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-label="فيديو الهيرو"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    id="hero-frame-poster"
                    key={displaySrc}
                    src={displaySrc}
                    alt=""
                    loading="eager"
                    decoding="async"
                  />
                )}
              </div>
              <div className="hero-dashboard" aria-hidden="true">
                <article className="hero-panel hero-panel-main">
                  <header>
                    <span className="hero-dot" />
                    <span>لوحة التحكم القانونية</span>
                    <i className="fas fa-chart-line" />
                  </header>
                  <div className="hero-chart-bars">
                    <span /><span /><span /><span /><span />
                  </div>
                  <div className="hero-progress">
                    <div className="progress-track"><div className="progress-fill" /></div>
                    <div className="progress-track"><div className="progress-fill" /></div>
                  </div>
                  <div className="hero-panel-grid">
                    <span>القضايا النشطة</span>
                    <strong>86%</strong>
                    <span>الجلسات القادمة</span>
                    <strong>+24</strong>
                  </div>
                </article>
                <article className="hero-panel hero-panel-metrics">
                  <p><i className="fas fa-bolt" /> أداء المكتب</p>
                  <strong>+31%</strong>
                </article>
                <article className="hero-panel hero-panel-status">
                  <span><i className="fas fa-circle-check" /> النظام القانوني</span>
                  <strong>جاهز الآن</strong>
                </article>
              </div>
              <div className="hero-glass-search" aria-hidden="true">
                <i className="fas fa-magnifying-glass" />
                <span>ابحث في القضايا والموكلين...</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img id="site-logo-hero-badge" src={logo} alt="شعار نايوش" />
            </div>

            <div className="hero-float-card" id="hero-float-card">
              <div className="hero-float-icon" aria-hidden="true">
                <i className="fas fa-play" />
              </div>
              <div className="hero-float-body">
                <strong className="hero-float-title" id="hero-float-title">
                  {floatTitle}
                </strong>
                {floatDesc ? (
                  <span className="hero-float-desc" id="hero-float-desc">
                    {floatDesc}
                  </span>
                ) : (
                  <span className="hero-float-desc" id="hero-float-desc" hidden />
                )}
              </div>
            </div>
          </div>

          <div className="hero-media-note" aria-label="ملاحظات ومرفقات">
            <textarea
              className="hero-note-text"
              placeholder="اكتب ملاحظاتك"
              rows={3}
              aria-label="ملاحظاتك"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Link href="/app/archive" className="hero-note-upload" aria-label="رفع ملف PDF أو صورة">
              <i className="fas fa-paperclip" />
              <span>إضافة ملف PDF أو صورة</span>
            </Link>
          </div>
        </div>

        <nav className="hero-sidebar" data-hero-sidebar aria-label="قائمة الصفحات الجانبية في الهيرو">
          {SIDE_RAIL.map((item) => (
            <Link
              key={item.label}
              className="hero-sidebar-item"
              href={item.href}
              style={
                item.active
                  ? {
                      background: "#d70000",
                      borderColor: "rgba(255,255,255,0.28)",
                      boxShadow: "0 10px 24px rgba(215,0,0,0.45)",
                    }
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
          <div className="hero-sidebar-group">
            <button
              className="hero-sidebar-item hero-sidebar-toggle"
              type="button"
              aria-expanded={officeOpen}
              aria-controls="office-submenu"
              onClick={() => setOfficeOpen((v) => !v)}
            >
              <span>المكتب</span>
              <i className="fas fa-chevron-down hero-sidebar-arrow" aria-hidden="true" />
            </button>
            <div
              className={`hero-sidebar-submenu${officeOpen ? " open" : ""}`}
              id="office-submenu"
              aria-hidden={!officeOpen}
            >
              {OFFICE_PAGES.map((item) => (
                <Link
                  key={item.label}
                  className={`hero-sidebar-subitem${item.nested ? " hero-sidebar-subsubitem" : ""}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </main>

      <a href="#modules" className="scroll-indicator" aria-label="الانتقال للأسفل">
        <i className="fas fa-chevron-down" />
      </a>
    </section>
  );
}
