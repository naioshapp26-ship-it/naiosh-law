"use client";

import Link from "next/link";

const HERO_BG = "/newhome/media/legal-hero-desk.jpg";

const CTA_BUTTONS = [
  { label: "ابدأ الآن مجانًا", href: "/rent-system", primary: true, icon: "fa-rocket" },
  { label: "دخول النظام", href: "/login", primary: false, icon: "fa-right-to-bracket" },
  { label: "عرض الوحدات", href: "/#modules", primary: false, icon: "fa-grid-2" },
] as const;

const STATS = [
  { value: "99.9%", label: "وقت التشغيل", icon: "fa-chart-line" },
  { value: "500+", label: "موكل مسجل", icon: "fa-file-lines" },
  { value: "17", label: "وحدة تشغيلية", icon: "fa-users" },
] as const;

/**
 * Legal hero — full-bleed desk image + cinematic navy fog.
 * Content column parks on the visual RIGHT via RTL flex (not absolute offsets).
 */
export function EmpireLandingHero() {
  return (
    <section className="hero hero-has-image hero-legal-ref" aria-label="قسم الهيرو الرئيسي">
      <div className="hero-legal-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_BG} alt="" loading="eager" decoding="async" />
        <div className="hero-legal-fog" />
      </div>

      <main className="container hero-inner hero-legal-inner">
        <div className="hero-content hero-legal-content">
          <p className="hero-legal-eyebrow">
            <span className="hero-legal-eyebrow-line" aria-hidden="true" />
            <span>منظومة نايوش القانونية</span>
            <span className="hero-legal-eyebrow-line" aria-hidden="true" />
          </p>

          <h1 className="hero-legal-title">
            <span className="hero-legal-title-main">إدارة القضايا والموكلين</span>
            <span className="hero-legal-title-accent">بذكاء لا مثيل له</span>
          </h1>

          <p className="hero-legal-lead">
            منصة احترافية متكاملة لمكاتب المحاماة تضم 17 وحدة تشغيلية مترابطة — من إدارة القضايا
            والموكلين إلى الجلسات والمحاسبة القانونية والذكاء الاصطناعي.
          </p>

          <div className="hero-ctas hero-legal-ctas">
            {CTA_BUTTONS.map((btn) => (
              <Link
                key={btn.label}
                className={`btn hero-cta-pill magnetic-btn${btn.primary ? " hero-cta-gold" : " hero-cta-navy"}`}
                href={btn.href}
              >
                <i className={`fas ${btn.icon}`} aria-hidden="true" />
                <span>{btn.label}</span>
              </Link>
            ))}
          </div>

          <div className="hero-stats hero-legal-stats" aria-label="إحصائيات سريعة">
            {STATS.map((s) => (
              <article key={s.label} className="hero-legal-stat">
                <i className={`fas ${s.icon}`} aria-hidden="true" />
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </article>
            ))}
          </div>
        </div>
      </main>

      <a href="#modules" className="scroll-indicator hero-legal-scroll" aria-label="الانتقال للأسفل">
        <i className="fas fa-chevron-down" />
      </a>
    </section>
  );
}
