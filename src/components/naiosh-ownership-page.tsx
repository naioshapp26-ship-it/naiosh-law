"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { BrandLogo } from "@/components/brand-logo";
import { ensureErpHomepageStylesheets, setHomepageMode } from "@/components/homepage-route-chrome";
import {
  NAIOSH_OWNERSHIP_PAGE_CARDS,
  NAIOSH_OWNERSHIP_PAGE_INTRO,
} from "@/data/naiosh-ownership-menu";

const LANDING_SHARED_HREF = "/newhome/landing-shared.css?v=ownership-page-20261026";

export default function NaioshOwnershipPage() {
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
        <section className="landing-hub ownership-hub" aria-label="ملكية نايوش">
          <header className="landing-hub-head">
            <h1>ملكية نايوش</h1>
            <p>{NAIOSH_OWNERSHIP_PAGE_INTRO}</p>
          </header>

          <div className="landing-hub-actions" style={{ marginTop: 8, marginBottom: 8 }}>
            <Link className="btn ghost" href="/">
              العودة للرئيسية
            </Link>
          </div>

          <div className="ownership-cards-grid" aria-label="أنواع الملكية والتوثيق">
            {NAIOSH_OWNERSHIP_PAGE_CARDS.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className={`ownership-card${card.id === "add-new" ? " ownership-card-accent" : ""}`}
              >
                <span className="landing-hub-card-icon" aria-hidden="true">
                  <i className={`fas ${card.icon}`} />
                </span>
                <h2>{card.label}</h2>
                <p>{card.desc}</p>
                <span className="landing-hub-card-cta">فتح ←</span>
              </Link>
            ))}
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
            <Link href="/naiosh-ownership">ملكية نايوش</Link>
            <Link href="/services">خدماتنا</Link>
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
