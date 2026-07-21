"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { BrandLogo } from "@/components/brand-logo";
import { ensureErpHomepageStylesheets, setHomepageMode } from "@/components/homepage-route-chrome";
import {
  LAW_SERVICE_CATEGORIES,
  LAW_SERVICES_INTRO,
  LAW_SERVICES_STATS,
} from "@/data/law-services";

const LANDING_SHARED_HREF = "/newhome/landing-shared.css?v=services-hub-20260721";

export default function ServicesPage() {
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

    return () => {
      // Keep stylesheets; HomepageRouteChrome will flip homepage mode by path.
    };
  }, []);

  return (
    <>
      {/* stylesheet also loaded from root layout + HomepageRouteChrome */}
      <LandingPromoBar />
      <Navbar variant="landing" />

      <main className="container" id="landing-hub-root" style={{ paddingTop: 24 }}>
        <section className="landing-hub" aria-label="خدماتنا">
          <header className="landing-hub-head">
            <h1>خدماتنا</h1>
            <p>{LAW_SERVICES_INTRO}</p>
          </header>

          <div className="landing-hub-stats" aria-label="إحصائيات الخدمات">
            {LAW_SERVICES_STATS.map((stat) => (
              <article key={stat.label} className="landing-hub-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>

          <div className="landing-hub-grid" aria-label="فئات الخدمات">
            {LAW_SERVICE_CATEGORIES.map((cat) => (
              <a key={cat.id} className="landing-hub-card" href={`#${cat.id}`}>
                <span className="landing-hub-card-icon">
                  <i className={`fas ${cat.icon}`} aria-hidden="true" />
                </span>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
                <span className="landing-hub-card-cta">
                  عرض {cat.items.length} خدمات ←
                </span>
              </a>
            ))}
          </div>

          <div className="landing-hub-actions">
            <Link className="btn primary" href="/rent-system">
              استأجر نظام الآن
            </Link>
            <Link className="btn ghost" href="/#footer-support">
              تواصل معنا
            </Link>
          </div>

          <div className="landing-hub-details" aria-label="تفاصيل كل الخدمات">
            {LAW_SERVICE_CATEGORIES.map((cat) => (
              <section key={cat.id} id={cat.id} className="landing-hub-detail">
                <div className="landing-hub-detail-head">
                  <span className="landing-hub-card-icon">
                    <i className={`fas ${cat.icon}`} aria-hidden="true" />
                  </span>
                  <div>
                    <h2>{cat.title}</h2>
                    <p>{cat.desc}</p>
                  </div>
                </div>
                <ol className="landing-hub-detail-list">
                  {cat.items.map((item, index) => (
                    <li key={`${cat.id}-${index}`}>
                      <span className="num">{index + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <div className="landing-hub-actions">
            <Link className="btn primary" href="/register">
              ابدأ الآن مجانًا
            </Link>
            <Link className="btn ghost" href="/login">
              دخول النظام
            </Link>
          </div>
        </section>
      </main>

      <nav className="floating-actions" aria-label="أزرار جانبية عائمة">
        <Link href="/app/dashboard" title="إضافة" aria-label="إضافة">
          <i className="fas fa-plus" />
        </Link>
        <Link href="/services" title="الخدمات" aria-label="الخدمات">
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
            <Link href="/rent-system">استأجر نظام الآن</Link>
            <Link href="/app/dashboard">لوحة التحكم</Link>
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
