"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { EmpireLandingHero } from "@/components/empire-landing-hero";
import { ErpHomepageStyles } from "@/components/erp-homepage-styles";
import { BrandLogo } from "@/components/brand-logo";
import { modules } from "@/data/modules";

const features = [
  {
    icon: "fa-scale-balanced",
    title: "إدارة قضايا متكاملة",
    desc: "تتبع كل مرحلة من مراحل القضية بدقة وتوثيق شامل من الفتح حتى الإغلاق",
  },
  {
    icon: "fa-landmark",
    title: "جلسات وتذكيرات ذكية",
    desc: "جدولة آلية مع تنبيهات تصل قبل الجلسة بوقت كافٍ عبر قنوات متعددة",
  },
  {
    icon: "fa-coins",
    title: "محاسبة قانونية دقيقة",
    desc: "رسوم وفواتير وتقارير مالية منفصلة لكل قضية وموكل مع تتبع المدفوعات",
  },
  {
    icon: "fa-chart-line",
    title: "تقارير تنفيذية فورية",
    desc: "تحليلات أداء الفريق والقضايا والمالية بفلاتر متقدمة وتصدير فوري",
  },
  {
    icon: "fa-brain",
    title: "ذكاء اصطناعي قانوني",
    desc: "تحليل المستندات وتلخيص القضايا واقتراح الصياغات القانونية تلقائيًا",
  },
  {
    icon: "fa-shield-halved",
    title: "صلاحيات متعددة المستويات",
    desc: "تحكم كامل في صلاحيات كل مستخدم وفريق مع سجل تدقيق شامل",
  },
];

export default function LandingHome() {
  const [dynamicSections, setDynamicSections] = useState<
    {
      id: string;
      title: string;
      description: string | null;
      link: string | null;
      iconClass: string;
      iconUrl: string | null;
      orderIndex: number;
    }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/homepage-sections", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setDynamicSections(
          [...items].sort((a, b) => (Number(a.orderIndex) || 0) - (Number(b.orderIndex) || 0))
        );
      })
      .catch(() => {
        if (!cancelled) setDynamicSections([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{document.body.classList.add('homepage')}catch(_){}`,
        }}
      />
      <ErpHomepageStyles />
      <LandingPromoBar />
      <Navbar variant="landing" />
      <EmpireLandingHero />

      <section className="container" style={{ padding: "2rem 1rem 0", maxWidth: 1100, margin: "0 auto" }} aria-label="الدفع وشحن الرصيد">
        <div
          style={{
            borderRadius: "1rem",
            border: "1px solid #fecaca",
            background: "rgba(255,255,255,.95)",
            boxShadow: "0 4px 24px rgba(185,28,28,.08)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <p style={{ fontSize: ".875rem", fontWeight: 600, color: "#4b5563", margin: 0 }}>الأرصدة المتاحة</p>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "#b91c1c", margin: ".25rem 0 0" }}>شحن فوري وآمن</p>
            <p style={{ fontSize: ".75rem", color: "#6b7280", margin: ".35rem 0 0" }}>
              الرصيد جيد — اشترِ باقات الرصيد واستخدمها في خدماتك
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
            <Link href="/login" style={{ fontSize: ".875rem", fontWeight: 700, color: "#b91c1c", textDecoration: "underline", textUnderlineOffset: 4 }}>
              شحن الأرصدة
            </Link>
            <Link href="/login" style={{ fontSize: ".875rem", fontWeight: 700, color: "#991b1b", marginInlineStart: "1rem" }}>
              كل خيارات الدفع ←
            </Link>
          </div>
        </div>
      </section>

      <main id="modules">
        {dynamicSections.length > 0 && (
          <>
            <section className="section-head">
              <div>
                <h2>الأقسام الرئيسية</h2>
                <p>محتوى مخصص من إعدادات النظام بنفس هوية ERP.</p>
              </div>
            </section>
            <section className="cards" id="main-sections-grid">
              {dynamicSections.map((section) => {
                const inner = (
                  <>
                    <div className="icon-box">
                      {section.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={section.iconUrl} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
                      ) : (
                        <i className={section.iconClass || "fas fa-layer-group"} />
                      )}
                    </div>
                    <h3>{section.title}</h3>
                    <p>{section.description || ""}</p>
                  </>
                );
                return section.link ? (
                  <Link key={section.id} className="card" href={section.link}>
                    {inner}
                  </Link>
                ) : (
                  <article key={section.id} className="card">
                    {inner}
                  </article>
                );
              })}
            </section>
          </>
        )}

        <section className="section-head" id="features">
          <div>
            <h2>لماذا تختار NAIOSH Law؟</h2>
            <p>نظام قانوني متكامل بنفس هوية إمبراطورية نايوش البصرية والحركية.</p>
          </div>
        </section>

        <section className="cards">
          {features.map((f) => (
            <article key={f.title} className="card">
              <div className="icon-box">
                <i className={`fas ${f.icon}`} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </section>

        <section className="section-head" id="modules-grid-head">
          <div>
            <h2>17 وحدة تشغيلية مترابطة</h2>
            <p>كل وحدة مستقلة بشاشاتها ووظائفها وعلاقاتها وصلاحياتها الخاصة.</p>
          </div>
        </section>

        <section className="cards" id="demo-request">
          {modules.slice(0, 9).map((item) => (
            <Link key={item.slug} className="card" href={`/app/modules/${item.slug}`}>
              <div className="icon-box">
                <i className="fas fa-briefcase" />
              </div>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
            </Link>
          ))}
        </section>

        <section className="newsletter-section" aria-label="ابدأ الآن">
          <div className="newsletter-inner">
            <h2>جاهز لإدارة مكتبك القانوني؟</h2>
            <p>ادخل النظام الآن وابدأ بإدارة القضايا والموكلين بنفس تجربة إمبراطورية نايوش.</p>
            <div className="newsletter-form" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/login">
                ابدأ الآن مجانًا
              </Link>
              <Link className="btn btn-secondary" href="/app/dashboard">
                دخول لوحة التحكم
              </Link>
            </div>
          </div>
        </section>
      </main>

      <nav className="floating-actions" aria-label="أزرار جانبية عائمة">
        <Link href="/app/dashboard" title="إضافة" aria-label="إضافة">
          <i className="fas fa-plus" />
        </Link>
        <Link href="/app/specialty/clients" title="المفضلة" aria-label="المفضلة">
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
            <p>أنظمة ذكية تدير الأعمال وتسرّع النمو</p>
          </section>

          <section className="site-footer-col" aria-label="روابط سريعة">
            <h3>روابط سريعة</h3>
            <Link href="/">الرئيسية</Link>
            <Link href="/login">استأجر نظام الآن</Link>
            <Link href="/#modules">التصنيفات</Link>
            <Link href="/#features">المميزات</Link>
            <Link href="/app/dashboard">لوحة التحكم</Link>
          </section>

          <section className="site-footer-col" aria-label="خدمة العملاء">
            <h3>خدمة العملاء</h3>
            <Link href="/#footer-support">اتصل بنا</Link>
            <Link href="/login">سجل معنا</Link>
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
