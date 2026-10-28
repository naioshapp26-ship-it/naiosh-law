"use client";

import Link from "next/link";

/** Live NAIOSH Intelligence analysis system (external — no SSO claimed). */
const ANALYSIS_SITE = "https://www.naioshai.com/";
const ANALYSIS_LOGIN = "https://www.naioshai.com/#login";

export function DataAnalysisLanding() {
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
              اكتشف قوة بياناتك مع أدوات التحليل والتقارير والاستشارات الذكية. هذه الصفحة
              داخل NAIOSH LAW تعرّفك بالنظام وتربطك بموقع التحليل المعتمد — دون المرور
              بلوحة الأدمن أو HUB 360.
            </p>
            <div className="da-law-hero__note" role="status">
              <span aria-hidden="true">⚖️</span>
              <span>
                تسجيل الدخول إلى نظام التحليل يتم عبر موقع التحليل نفسه (
                naioshai.com). لا يُفترض وجود تسجيل دخول موحّد (SSO) مع NAIOSH LAW في هذه
                المرحلة.
              </span>
            </div>
            <div className="da-law-hero__actions">
              <a
                href={ANALYSIS_SITE}
                className="da-law-btn primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                ابدأ التحليل
              </a>
              <a
                href={ANALYSIS_LOGIN}
                className="da-law-btn secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                تسجيل الدخول إلى نظام التحليل
              </a>
              <Link href="/" className="da-law-btn ghost-on-dark">
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
                    stroke="rgba(248,250,252,0.45)"
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
          <strong>نايوش لتحليل البيانات</strong> (NAIOSH Intelligence) تطبيق مستقل للتحليل
          والقرار. هذه الصفحة داخل NAIOSH LAW تعرّفك به وتربطك بالتسجيل والدخول على موقع
          التحليل المعتمد — دون جمع كلمات مرورك هنا ودون التحويل إلى HUB 360.
        </p>
        <div className="da-law-grid-3">
          <article className="da-law-card">
            <div className="ico">CSV</div>
            <h3>ملفات بياناتك</h3>
            <p>CSV أو Excel داخل المتصفح — حتى 40 ميجابايت — مع لوحة مؤشرات من أعمدة ملفك.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">⚖️</div>
            <h3>تحليل بمختص</h3>
            <p>أرسل طلبًا لفريق التحليل مع المرفقات، واستلم تقريرًا موثّقًا من نظام التحليل.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">📊</div>
            <h3>محاور تشغيلية</h3>
            <p>مالية، موارد، مبيعات، قانون، وغيرها — بأسئلة واضحة وتقارير قابلة للتصدير.</p>
          </article>
        </div>
      </section>

      <section className="da-law-section" aria-labelledby="da-offer">
        <h2 id="da-offer">ماذا يقدّم؟</h2>
        <p className="lead">
          إمكانيات ظاهرة في واجهة نظام التحليل الحي — بدون وعود غير موجودة، وبدون افتراض SSO
          غير منفّذ.
        </p>
        <div className="da-law-grid-3">
          <article className="da-law-card">
            <div className="ico">1</div>
            <h3>أنواع تحليل متعددة</h3>
            <p>وصفي، تشخيصي، تنبؤي، استشرافي، جدوى، مخاطر، فرص، توجيهي، ومقارنة.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">2</div>
            <h3>دخول عبر موقع التحليل</h3>
            <p>اضغط «تسجيل الدخول إلى نظام التحليل» لفتح naioshai.com وإكمال الدخول هناك.</p>
          </article>
          <article className="da-law-card">
            <div className="ico">3</div>
            <h3>صفحة تعريف داخل LAW</h3>
            <p>الرابط في الهيدر العام يبقى؛ التعريف داخل NAIOSH LAW بهوية كحلية وذهبية.</p>
          </article>
        </div>
        <div className="da-law-offer-actions">
          <a
            href={ANALYSIS_SITE}
            className="da-law-btn primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            ابدأ التحليل
          </a>
          <a
            href={ANALYSIS_LOGIN}
            className="da-law-btn secondary-light"
            target="_blank"
            rel="noopener noreferrer"
          >
            تسجيل الدخول إلى نظام التحليل
          </a>
        </div>
      </section>
    </div>
  );
}
