"use client";

import { useEffect } from "react";
import Link from "next/link";

function ensureCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[data-da-law-css]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/erp-app/data-analysis-law.css?v=law-da-20261028a";
  link.setAttribute("data-da-law-css", "1");
  document.head.appendChild(link);
}

export function DataAnalysisLanding() {
  useEffect(() => {
    ensureCss();
  }, []);

  return (
    <div className="da-law" dir="rtl">
      <section className="da-law-hero" aria-labelledby="da-law-hero-title">
        <div className="da-law-hero__glow" aria-hidden="true" />
        <div className="da-law-hero__row">
          <div className="da-law-hero__copy">
            <p className="da-law-hero__badge">NAIOSH LAW · تحليل قانوني</p>
            <h1 className="da-law-hero__title" id="da-law-hero-title">
              نايوش لتحليل البيانات
            </h1>
            <p className="da-law-hero__tag">ذكاء يحوّل بياناتك القانونية إلى قرارات</p>
            <p className="da-law-hero__lead">
              حلّل القضايا والجلسات والموكلين والمحاسبة القانونية داخل منظومة نايوش
              القانونية — أو ارفع ملف CSV/Excel مصرّحًا به — مع احترام صلاحياتك وعزل
              بيانات العملاء. دون نقاط ترحيب أو تسعير من أنظمة أخرى.
            </p>
            <div className="da-law-hero__note" role="status">
              <span aria-hidden="true">⚖️</span>
              <span>
                يعمل داخل جلسة NAIOSH LAW الحالية. لا يُطلب تسجيل دخول جديد، ولا تُنقل
                بياناتك إلى HUB 360 أو نظام النقاط الخارجي.
              </span>
            </div>
            <div className="da-law-hero__actions">
              <Link href="/app/data-analysis/workspace" className="da-law-btn primary">
                ابدأ التحليل
              </Link>
              <Link href="/app/dashboard" className="da-law-btn secondary">
                العودة للوحة التحكم
              </Link>
            </div>
          </div>

          <div className="da-law-visual" aria-hidden="true">
            <div className="da-law-visual__brand">
              <span className="da-law-visual__brand-mark">LAW</span>
              نظام نايوش لتحليل البيانات القانونية
            </div>
            <div className="da-law-visual__art">
              <div className="da-law-chart">
                <svg viewBox="0 0 220 90" role="img">
                  <polyline
                    fill="none"
                    stroke="#b79a61"
                    strokeWidth="2.5"
                    points="8,70 35,55 60,62 90,30 120,40 150,18 180,28 210,12"
                  />
                  <polyline
                    fill="none"
                    stroke="rgba(248,250,252,0.35)"
                    strokeWidth="1.5"
                    points="8,78 35,74 60,70 90,66 120,60 150,58 180,50 210,46"
                  />
                </svg>
              </div>
              <div className="da-law-kpi-stack">
                <div className="da-law-kpi">
                  <strong>قضايا نشطة</strong>
                  <span>مؤشر من بياناتك</span>
                </div>
                <div className="da-law-kpi">
                  <strong>جلسات قادمة</strong>
                  <span>جدول زمني</span>
                </div>
                <div className="da-law-kpi">
                  <strong>تحصيل</strong>
                  <span>مالية قانونية</span>
                </div>
              </div>
            </div>
            <div className="da-law-visual__foot">
              <span>تصور توضيحي — داخل هوية NAIOSH LAW</span>
              <b>مساحة العمل</b>
            </div>
          </div>
        </div>
      </section>

      <section className="da-law-section" aria-labelledby="da-what">
        <h2 id="da-what">ما هو النظام؟</h2>
        <p className="lead">
          محرك تحليل جدولي مكيّف للمنظومة القانونية: يستمد بياناته من السجلات
          المصرّح بها لك، أو من ملف ترفعه بنفسك، ويحسب مؤشرات وأنواع تحليل متعددة
          داخل المتصفح — مع نسخة تدقيق للملف على خادم LAW فقط.
        </p>
        <div className="da-law-grid-3">
          <article className="da-law-card">
            <div className="ico">CSV</div>
            <h3>ملفات بياناتك</h3>
            <p>CSV أو Excel حتى 40 ميجابايت، مع التحقق من النوع والحجم وبصمة SHA-256.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">⚖️</div>
            <h3>بيانات قانونية مصرّح بها</h3>
            <p>قضايا، جلسات، موكلون، ومحاسبة قانونية — وفق دورك وعزل سجلات العميل.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">📊</div>
            <h3>تقارير قابلة للتصدير</h3>
            <p>نتائج وصفية وتشخيصية وتنبؤية ومخاطر ومقارنة — وتصدير CSV للتقرير.</p>
          </article>
        </div>
      </section>

      <section className="da-law-section" aria-labelledby="da-offer">
        <h2 id="da-offer">ماذا يقدّم؟</h2>
        <p className="lead">
          إمكانيات مستمدة من المحرك التحليلي الأصلي، مكيّفة للقانون — بدون عروض
          تجريبية أو نقاط أو تسعير من HUB.
        </p>
        <div className="da-law-grid-3">
          <article className="da-law-card">
            <div className="ico">1</div>
            <h3>عشرة أنواع تحليل</h3>
            <p>وصفي، تشخيصي، تنبؤي، استشرافي، جدوى، مخاطر، فرص، توجيهي، مقارنة، قياس أثر.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">2</div>
            <h3>صلاحيات LAW</h3>
            <p>جلسة الدخول الحالية كافية. دور العميل يرى سجلاته فقط.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">3</div>
            <h3>عزل التخزين</h3>
            <p>ملفات التحليل تُحفظ تحت مجلد المستخدم في LAW — منفصلة عن HUB وIntelligence.</p>
          </article>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <Link href="/app/data-analysis/workspace" className="da-law-btn primary">
            الدخول إلى أدوات التحليل
          </Link>
        </div>
      </section>
    </div>
  );
}
