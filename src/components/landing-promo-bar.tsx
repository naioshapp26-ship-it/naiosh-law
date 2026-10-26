"use client";

/**
 * شريط العروض — بيانات منظومة نايوش القانونية.
 * الحركة: أول كلمة عربية تظهر عند الحافة اليمنى ثم تنتقل يمين→يسار.
 * (قلب أفقي مزدوج يصحّح حافة الدخول دون عكس ترتيب الكلمات)
 */
export function LandingPromoBar() {
  return (
    <div
      className="announcement-bar"
      id="announcement-bar"
      role="status"
      aria-live="polite"
    >
      <div className="announcement-mover" id="announcement-track">
        <div className="announcement-track">
          <span className="announcement-inner" dir="rtl">
            ابدأ الآن | عروض محدودة على منظومة نايوش القانونية 360 —{" "}
            <a href="/login" style={{ color: "#fecaca", fontWeight: 900, textDecoration: "underline" }}>
              سجّل مجانًا
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Promo bar height used by ERP sticky header offset. */
export const LANDING_HEADER_OFFSET = 50;
