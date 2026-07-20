"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSiteTheme } from "@/components/theme-provider";
import { isHeroVideoSrc } from "@/lib/hero-media";

const SIDE_RAIL = [
  { label: "فرعي", href: "/app/specialty/cases" },
  { label: "حاضنتي", href: "/app/specialty/clients" },
  { label: "منصتي", href: "/app/specialty/sessions" },
  { label: "مكتبي", href: "/app/specialty/library" },
  { label: "أنظمتي", href: "/app/specialty/systems" },
  { label: "شركاتي", href: "/app/specialty/finance" },
  { label: "إعلاناتي", href: "/app/specialty/archive" },
  { label: "صفحتي", href: "/app/specialty/profile", active: true },
  { label: "الأعضاء", href: "/app/specialty/team" },
];

const EMPRESS_PAGES = [
  { label: "استشارات", href: "/#features" },
  { label: "دراسات", href: "/#modules" },
  { label: "تواصل مع الإمبراطورة", href: "/#footer-support" },
  { label: "اشتراك", href: "/login", nested: true },
  { label: "استشارة مجانية", href: "/#demo-request", nested: true },
];

const CTA_BUTTONS = [
  { label: "استأجر نظام الآن", href: "/login" },
  { label: "الدفع وشحن الرصيد", href: "/login" },
  { label: "استكشف المساحات", href: "/#modules" },
  { label: "احجز جولة", href: "/#demo-request" },
];

const STATS = [
  { value: 20000, label: "أعضاء نايوش" },
  { value: 200, label: "منصات" },
  { value: 50, label: "حاضنة أعمال" },
];

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat">
      <strong data-count={value}>{value.toLocaleString("en-US")}</strong>
      <span>{label}</span>
    </div>
  );
}

/**
 * Hero matching NAIOSH ERP `/newhome` structure, classes, and motion chrome.
 * Content slots keep Law routes while the layout/CSS is an ERP copy-paste.
 */
export function EmpireLandingHero() {
  const { heroBannerSrc, theme, logoSrc } = useSiteTheme();
  const [libraryMedia, setLibraryMedia] = useState<{ type: string; url: string }[]>([]);
  const [slide, setSlide] = useState(0);
  const [empressOpen, setEmpressOpen] = useState(false);
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
    return "التكنولوجيا في حياتنا اليومية";
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
          <h1 className="hero-heading-white">أنظمة ذكية تدير الأعمال وتسرّع النمو</h1>
          <p>
            إمبراطورية نايوش تقدم حلولاً متكاملة من حاضنات أعمال، مسرعات، ومكاتب عمل مصممة لدعم رواد
            الأعمال والشركات الناشئة.
          </p>
          <div className="hero-ctas">
            {CTA_BUTTONS.map((btn) => (
              <Link key={btn.label} className="btn btn-primary hero-cta-pill magnetic-btn" href={btn.href}>
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
                    <span>لوحة التحكم الذكية</span>
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
                    <span>الإشغال</span>
                    <strong>86%</strong>
                    <span>الطلبات الجديدة</span>
                    <strong>+24</strong>
                  </div>
                </article>
                <article className="hero-panel hero-panel-metrics">
                  <p><i className="fas fa-bolt" /> أداء المنصة</p>
                  <strong>+31%</strong>
                </article>
                <article className="hero-panel hero-panel-status">
                  <span><i className="fas fa-circle-check" /> المكاتب الذكية</span>
                  <strong>جاهزة الآن</strong>
                </article>
              </div>
              <div className="hero-glass-search" aria-hidden="true">
                <i className="fas fa-magnifying-glass" />
                <span>ابحث عن مساحتك المثالية...</span>
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
            <Link key={item.label} className="hero-sidebar-item" href={item.href}>
              {item.label}
            </Link>
          ))}
          <div className="hero-sidebar-group">
            <button
              className="hero-sidebar-item hero-sidebar-toggle"
              type="button"
              aria-expanded={empressOpen}
              aria-controls="empress-submenu"
              onClick={() => setEmpressOpen((v) => !v)}
            >
              <span>الإمبراطورة</span>
              <i className="fas fa-chevron-down hero-sidebar-arrow" aria-hidden="true" />
            </button>
            <div
              className={`hero-sidebar-submenu${empressOpen ? " open" : ""}`}
              id="empress-submenu"
              aria-hidden={!empressOpen}
            >
              {EMPRESS_PAGES.map((item) => (
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
