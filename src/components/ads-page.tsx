"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { BrandLogo } from "@/components/brand-logo";
import { ensureErpHomepageStylesheets, setHomepageMode } from "@/components/homepage-route-chrome";
import {
  LAW_ADS_CATEGORIES,
  LAW_ADS_HERO,
  LAW_ADS_ITEMS,
  LAW_ADS_PREMIUM,
  LAW_ADS_STATS,
  LAW_ADS_STEPS,
  LAW_ADS_TABS,
  LAW_ADS_TESTIMONIALS,
} from "@/data/law-ads";

const ADS_CSS = "/newhome/ads-page.css?v=erp-ads-copy-20260721";

type TabId = (typeof LAW_ADS_TABS)[number]["id"];

export default function AdsPage() {
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");
  const [statValues, setStatValues] = useState(() => LAW_ADS_STATS.map(() => 0));
  const [progressReady, setProgressReady] = useState(false);
  const statsRef = useRef<HTMLElement | null>(null);
  const latestRef = useRef<HTMLElement | null>(null);
  const animatedStats = useRef(false);

  useEffect(() => {
    ensureErpHomepageStylesheets();
    setHomepageMode(true);
    document.body.classList.add("ads-route");
    if (!document.querySelector(`link[href="${ADS_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = ADS_CSS;
      link.setAttribute("data-erp-home", "1");
      document.head.appendChild(link);
    }
    return () => {
      document.body.classList.remove("ads-route");
    };
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll(".ads-reveal");
    nodes.forEach((node, index) => {
      (node as HTMLElement).style.setProperty("--reveal-delay", `${Math.min(index * 0.06, 0.32)}s`);
    });
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach((node) => revealObserver.observe(node));
    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    const section = statsRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || animatedStats.current) return;
          animatedStats.current = true;
          setProgressReady(true);
          LAW_ADS_STATS.forEach((stat, index) => {
            const start = performance.now();
            const duration = 1300;
            const tick = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              const value = Math.floor(progress * stat.value);
              setStatValues((prev) => {
                const next = [...prev];
                next[index] = value;
                return next;
              });
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const displayItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LAW_ADS_ITEMS;
    return LAW_ADS_ITEMS.filter((item) => item.title.toLowerCase().includes(q));
  }, [query]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onNewsletter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.elements.namedItem("email") as HTMLInputElement | null;
    if (email?.checkValidity()) email.value = "";
  };

  return (
    <>
      <LandingPromoBar />
      <Navbar variant="landing" />

      <main className="container ads-page" style={{ paddingTop: 24 }}>
        <section className="ads-hero ads-reveal">
            <div className="ads-hero-content">
              <h1>{LAW_ADS_HERO.title}</h1>
              <p>{LAW_ADS_HERO.subtitle}</p>
              <form id="adsSearchForm" className="ads-search-wrap" aria-label="شريط بحث الإعلانات" onSubmit={onSearch}>
                <input
                  type="search"
                  name="query"
                  placeholder={LAW_ADS_HERO.searchPlaceholder}
                  aria-label="بحث الإعلانات"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" aria-label="بحث الآن">
                  بحث الآن
                </button>
              </form>
            </div>
          </section>

          <section ref={statsRef} aria-label="إحصائيات الإعلانات" className="ads-reveal">
            <h2 className="ads-section-title">إدارة الإعلانات</h2>
            <div className="ads-stats">
              {LAW_ADS_STATS.map((stat, i) => (
                <article key={stat.label} className="ads-stat-card">
                  <p className="ads-stat-number" data-count={stat.value}>
                    {statValues[i].toLocaleString("en-US")}
                  </p>
                  <p className="ads-stat-label">{stat.label}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-label="فئات الإعلانات" className="ads-reveal">
            <h2 className="ads-section-title">التصنيفات</h2>
            <div className="ads-categories-grid">
              {LAW_ADS_CATEGORIES.map((cat) => (
                <article key={cat.title} className="ads-category-card">
                  <span className="ads-cat-icon">
                    <i className={`fas ${cat.icon}`} aria-hidden="true" />
                  </span>
                  <h3>{cat.title}</h3>
                  <p>{cat.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section ref={latestRef} aria-label="أحدث الإعلانات" className="ads-reveal">
            <h2 className="ads-section-title">أحدث الإعلانات</h2>
            <div className="ads-tabs" role="tablist" aria-label="تبويبات الإعلانات">
              {LAW_ADS_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`ads-tab${tab === t.id ? " is-active" : ""}`}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="ads-latest-grid">
              {displayItems.map((item) => (
                <article key={item.id} className="ads-item-card">
                  <div className="ads-item-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.imageAlt} />
                  </div>
                  <div className="ads-item-body">
                    <p className="ads-price">{item.price}</p>
                    <h3 className="ads-item-title">{item.title}</h3>
                    <p className="ads-meta">
                      <span>
                        <i className="fas fa-eye" aria-hidden="true" /> {item.views}
                      </span>
                      <span>
                        <i className="fas fa-clock" aria-hidden="true" /> {item.time}
                      </span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
            {displayItems.length === 0 ? (
              <p style={{ textAlign: "center", marginTop: 18, color: "#5f6672", fontWeight: 700 }}>
                لا توجد إعلانات مطابقة لبحثك.
              </p>
            ) : null}
          </section>

          <section aria-label="آراء عملائنا" className="ads-reveal">
            <h2 className="ads-section-title">آراء عملائنا</h2>
            <div className="ads-testimonials-grid">
              {LAW_ADS_TESTIMONIALS.map((t) => (
                <article key={t.name} className="ads-testimonial">
                  <div className="ads-testimonial-head">
                    <span className="ads-avatar">{t.initial}</span>
                    <div>
                      <strong>{t.name}</strong>
                      <div className="ads-stars">★★★★★</div>
                    </div>
                  </div>
                  <p>{t.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-label="كيف يعمل النظام" className="ads-reveal">
            <h2 className="ads-section-title">كيف يعمل النظام</h2>
            <div className="ads-steps-grid">
              {LAW_ADS_STEPS.map((step) => (
                <article key={step.n} className="ads-step-card">
                  <span className="ads-step-number">{step.n}</span>
                  <h3>
                    <i className={`fas ${step.icon} ads-step-icon`} aria-hidden="true" />
                    {step.title}
                  </h3>
                  <p>{step.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="ads-premium ads-reveal" aria-label="الإعلانات المميزة">
            <article className="ads-pricing">
              <h3>{LAW_ADS_PREMIUM.title}</h3>
              <p>{LAW_ADS_PREMIUM.subtitle}</p>
              <div className="ads-price-tag">{LAW_ADS_PREMIUM.price}</div>
              <p>{LAW_ADS_PREMIUM.period}</p>
            </article>
            <div className="ads-features">
              {LAW_ADS_PREMIUM.features.map((f) => (
                <article key={f.label} className="ads-feature">
                  <div className="ads-feature-head">
                    <span>{f.label}</span>
                    <span>{f.value}%</span>
                  </div>
                  <div className="ads-progress">
                    <span data-progress={f.value} style={{ width: progressReady ? `${f.value}%` : "0%" }} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ads-newsletter ads-reveal" aria-label="الاشتراك في النشرة البريدية">
            <div className="ads-newsletter-inner">
              <h2>اشترك في نشرتنا البريدية</h2>
              <p>احصل على آخر العروض والأخبار مباشرة إلى بريدك الإلكتروني</p>
              <form className="ads-newsletter-form" id="adsNewsletterForm" onSubmit={onNewsletter}>
                <input type="email" name="email" placeholder="بريدك الإلكتروني" aria-label="بريدك الإلكتروني" required />
                <button type="submit" className="ads-newsletter-btn">
                  اشترك
                </button>
              </form>
            </div>
          </section>
      </main>

      <nav className="floating-actions" aria-label="أزرار جانبية عائمة">
        <Link href="/app/dashboard" title="إضافة" aria-label="إضافة">
          <i className="fas fa-plus" />
        </Link>
        <Link href="/ads" title="الإعلانات" aria-label="الإعلانات">
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
            <Link href="/ads">الإعلانات</Link>
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
