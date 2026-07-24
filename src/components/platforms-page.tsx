"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { BrandLogo } from "@/components/brand-logo";
import { ensureErpHomepageStylesheets, setHomepageMode } from "@/components/homepage-route-chrome";
import {
  LAW_INCUBATOR_INTRO,
  LAW_INCUBATOR_STACK,
  LAW_INCUBATOR_TITLE,
  LAW_PLATFORM_CARDS,
  LAW_PLATFORM_CATEGORIES,
  LAW_PLATFORMS_INTRO,
  LAW_PLATFORMS_STATS,
  LAW_PLATFORMS_TITLE,
} from "@/data/law-platforms";

const LANDING_SHARED_HREF = "/newhome/landing-shared.css?v=platforms-cards-ordered-20260724";

export default function PlatformsPage() {
  useEffect(() => {
    ensureErpHomepageStylesheets();
    setHomepageMode(true);
    if (!document.querySelector(`link[href="${LANDING_SHARED_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LANDING_SHARED_HREF;
      link.setAttribute("data-erp-home", "1");
      document.head.appendChild(link);
    }
  }, []);

  return (
    <>
      <LandingPromoBar />
      <Navbar variant="landing" />

      <main className="container" id="landing-hub-root" style={{ paddingTop: 24 }}>
        <section className="landing-hub platforms-catalog" aria-label="المنصات">
          <header className="landing-hub-head" style={{ textAlign: "center" }}>
            <h1 style={{ textAlign: "center" }}>{LAW_PLATFORMS_TITLE}</h1>
            <p style={{ marginInline: "auto", textAlign: "center" }}>{LAW_PLATFORMS_INTRO}</p>
          </header>

          <div
            className="landing-hub-stats"
            aria-label="إحصائيات المنصات"
            style={{ justifyContent: "center" }}
          >
            {LAW_PLATFORMS_STATS.map((stat) => (
              <article key={stat.label} className="landing-hub-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>

          {/* كروت الأقسام — شبكة 2×2 مرتبة */}
          <div className="platforms-overview-grid" aria-label="أقسام المنصات">
            {LAW_PLATFORM_CARDS.map((card) => (
              <Link key={card.id} className="platforms-overview-card" href={card.href}>
                <span className="platforms-overview-icon" aria-hidden="true">
                  <i className={`fas ${card.icon}`} />
                </span>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <span className="platforms-overview-cta">{card.cta} ←</span>
              </Link>
            ))}
          </div>

          {/* أقسام الكتالوج — كروت مرقّمة مرتبة */}
          <div className="platforms-sections" aria-label="كتالوج المنصات والمكاتب والمراكز والأكاديميات">
            {LAW_PLATFORM_CATEGORIES.map((cat) => (
              <section key={cat.id} id={cat.id} className="platforms-section-card">
                <div className="platforms-section-head">
                  <span className="landing-hub-card-icon" aria-hidden="true">
                    <i className={`fas ${cat.icon}`} />
                  </span>
                  <div>
                    <h2>
                      {cat.title}
                      <span className="count">({cat.items.length})</span>
                    </h2>
                    <p>{cat.desc}</p>
                  </div>
                </div>
                <ol className="platforms-items-grid">
                  {cat.items.map((item, index) => (
                    <li key={`${cat.id}-${index}`} className="platforms-item-card">
                      <span className="platforms-item-num">{index + 1}</span>
                      <span className="platforms-item-label">{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}

            <section
              id="naiosh-360-incubators"
              className="platforms-section-card"
              aria-label={LAW_INCUBATOR_TITLE}
            >
              <div className="platforms-section-head">
                <span className="landing-hub-card-icon" aria-hidden="true">
                  <i className="fas fa-crown" />
                </span>
                <div>
                  <h2>
                    {LAW_INCUBATOR_TITLE}
                    <span className="count">({LAW_INCUBATOR_STACK.length})</span>
                  </h2>
                  <p>{LAW_INCUBATOR_INTRO}</p>
                </div>
              </div>
              <ol className="platforms-items-grid">
                {LAW_INCUBATOR_STACK.map((item, index) => (
                  <li key={`incubator-${index}`} className="platforms-item-card">
                    <span className="platforms-item-num">{index + 1}</span>
                    <span className="platforms-item-label">{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="landing-hub-actions" style={{ justifyContent: "center" }}>
            <Link className="btn primary" href="/app/dashboard">
              لوحة المنصات
            </Link>
            <Link className="btn ghost" href="/login">
              تسجيل الدخول
            </Link>
          </div>
        </section>
      </main>

      <nav className="floating-actions" aria-label="أزرار جانبية عائمة">
        <Link href="/app/dashboard" title="إضافة" aria-label="إضافة">
          <i className="fas fa-plus" />
        </Link>
        <Link href="/platforms" title="المنصات" aria-label="المنصات">
          <i className="fas fa-heart" />
        </Link>
        <Link href="/#footer-support" title="رسائل" aria-label="رسائل">
          <i className="fas fa-envelope" />
        </Link>
        <button
          type="button"
          id="to-top"
          title="الصعود للأعلى"
          aria-label="الصعود للأعلى"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <i className="fas fa-arrow-up" />
        </button>
      </nav>

      <footer className="site-footer" id="footer-support" aria-label="تذييل الصفحة">
        <div className="container site-footer-inner">
          <section className="site-footer-brand" aria-label="هوية نايوش">
            <BrandLogo href="/" size={56} showText={false} variant="dark" />
            <p>إدارة القضايا والموكلين بذكاء لا مثيل له</p>
          </section>
          <section className="site-footer-col" aria-label="روابط سريعة">
            <h3>روابط سريعة</h3>
            <Link href="/">الرئيسية</Link>
            <Link href="/services">خدماتنا</Link>
            <Link href="/branches">الفروع</Link>
            <Link href="/platforms">المنصات</Link>
          </section>
          <section className="site-footer-col" aria-label="خدمة العملاء">
            <h3>خدمة العملاء</h3>
            <Link href="/#footer-support">اتصل بنا</Link>
            <Link href="/register">سجل معنا</Link>
            <Link href="/login">سياسة الخصوصية</Link>
            <Link href="/login">الشروط والأحكام</Link>
          </section>
          <section className="site-footer-col" id="contact" aria-label="تواصل معنا">
            <h3>تواصل معنا</h3>
            <p>
              <i className="fas fa-location-dot" aria-hidden="true" /> الرياض، المملكة العربية السعودية
            </p>
            <p>
              <i className="fas fa-envelope" aria-hidden="true" /> info@naiosh.com
            </p>
            <p>
              <i className="fas fa-phone" aria-hidden="true" /> 920003456
            </p>
          </section>
        </div>
        <div className="site-footer-bottom">
          <div className="container site-footer-bottom-inner">
            <span>© {new Date().getFullYear()} NAIOSH Law — جميع الحقوق محفوظة</span>
          </div>
        </div>
      </footer>
    </>
  );
}
