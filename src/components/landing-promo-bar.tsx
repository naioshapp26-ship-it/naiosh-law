"use client";

/**
 * شريط العروض — بيانات منظومة نايوش القانونية.
 * الحركة: الجملة تدخل من أقصى الشمال وتتحرك ناحية اليمين،
 * وأول كلمة عربية (ابدأ) هي أول ما يظهر مع الحفاظ على RTL الطبيعي داخل الجملة.
 */
export function LandingPromoBar() {
  return (
    <div
      className="announcement-bar"
      id="announcement-bar"
      role="status"
      aria-live="polite"
      dir="rtl"
    >
      <div className="announcement-mover" id="announcement-track">
        <span className="announcement-inner" dir="rtl" lang="ar">
          ابدأ الآن | عروض محدودة على منظومة نايوش القانونية 360 —{" "}
          <a href="/login" style={{ color: "#fecaca", fontWeight: 900, textDecoration: "underline" }}>
            سجّل مجانًا
          </a>
        </span>
      </div>
    </div>
  );
}

/** Promo bar height used by ERP sticky header offset. */
export const LANDING_HEADER_OFFSET = 50;
