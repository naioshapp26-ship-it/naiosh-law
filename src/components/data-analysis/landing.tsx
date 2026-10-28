"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SessionInfo = {
  name: string | null;
  role: string | null;
};

const WORKSPACE_HREF = "/data-analysis/workspace";
const LOGIN_HREF = `/login?next=${encodeURIComponent(WORKSPACE_HREF)}`;

export function DataAnalysisLanding() {
  const [session, setSession] = useState<SessionInfo>({ name: null, role: null });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setSession({
          name: data?.user?.name ? String(data.user.name) : null,
          role: data?.user?.role ? String(data.user.role) : null,
        });
      })
      .catch(() => {
        if (!cancelled) setSession({ name: null, role: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isStaff =
    Boolean(session.role) && session.role !== "client";
  const startHref = isStaff ? WORKSPACE_HREF : LOGIN_HREF;
  const startLabel = isStaff ? "ابدأ التحليل" : "تسجيل الدخول وابدأ التحليل";

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
              اكتشف قوة بياناتك القانونية مع أدوات التحليل والتقارير داخل منظومة نايوش
              القانونية — قضايا، جلسات، موكلون، ومحاسبة — أو ارفع ملف CSV/Excel مصرّحًا به.
              الصفحة التعريفية عامة؛ التحليل الفعلي يتطلب تسجيل دخول وصلاحيات مناسبة.
            </p>
            <div className="da-law-hero__note" role="status">
              <span aria-hidden="true">⚖️</span>
              <span>
                {isStaff
                  ? `أنت مسجّل كـ «${session.name || "مستخدم"}» — التحليل يستخدم جلسة NAIOSH LAW الحالية دون دخول جديد أو انتقال إلى HUB 360.`
                  : "يمكنك تصفّح هذه الصفحة دون تسجيل دخول. لتشغيل التحليل على بياناتك القانونية سجّل الدخول بحساب المنظومة القانونية."}
              </span>
            </div>
            <div className="da-law-hero__actions">
              <Link href={startHref} className="da-law-btn primary">
                {startLabel}
              </Link>
              <Link href="/" className="da-law-btn secondary">
                العودة للرئيسية
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
              <b>من الموقع العام</b>
            </div>
          </div>
        </div>
      </section>

      <section className="da-law-section" aria-labelledby="da-what">
        <h2 id="da-what">ما هو النظام؟</h2>
        <p className="lead">
          <strong>نايوش لتحليل البيانات</strong> داخل NAIOSH LAW تطبيق تحليلي مكيّف للقانون.
          هذه الصفحة العامة تعرّفك به وتربطك بمساحة التحليل عبر جلسة المنظومة القانونية —
          دون جمع كلمات مرور هنا ودون التحويل إلى HUB 360.
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
          إمكانيات مستمدة من المحرك التحليلي الأصلي، مكيّفة للقانون — بدون عروض تجريبية أو
          نقاط أو تسعير من HUB.
        </p>
        <div className="da-law-grid-3">
          <article className="da-law-card">
            <div className="ico">1</div>
            <h3>عشرة أنواع تحليل</h3>
            <p>وصفي، تشخيصي، تنبؤي، استشرافي، جدوى، مخاطر، فرص، توجيهي، مقارنة، قياس أثر.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">2</div>
            <h3>جلسة LAW الحالية</h3>
            <p>بعد تسجيل الدخول لا يُطلب حساب جديد — التحليل يستخدم صلاحياتك في المنظومة القانونية.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">3</div>
            <h3>عزل التخزين</h3>
            <p>ملفات التحليل تُحفظ تحت مجلد المستخدم في LAW — منفصلة عن HUB وIntelligence.</p>
          </article>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <Link href={startHref} className="da-law-btn primary">
            {isStaff ? "الدخول إلى أدوات التحليل" : "سجّل الدخول لبدء التحليل"}
          </Link>
        </div>
      </section>
    </div>
  );
}
