"use client";

/**
 * ERP announcement bar — identical to NAIOSH ERP /newhome.
 */
export function LandingPromoBar() {
  return (
    <div className="announcement-bar" id="announcement-bar" role="status" aria-live="polite">
      <div className="announcement-track" id="announcement-track">
        🔥 خصومات على الخدمات 🔥 | 🚀 ابدأ الآن | 📢 عروض محدودة
      </div>
    </div>
  );
}

/** Promo bar height used by ERP sticky header offset. */
export const LANDING_HEADER_OFFSET = 50;
