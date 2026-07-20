"use client";

/**
 * شريط العروض — بيانات منظومة نايوش القانونية.
 */
export function LandingPromoBar() {
  return (
    <div className="announcement-bar" id="announcement-bar" role="status" aria-live="polite">
      <div className="announcement-track" id="announcement-track">
        ابدأ الآن | عروض محدودة على منظومة نايوش القانونية 360 —{" "}
        <a href="/login" style={{ color: "#fecaca", fontWeight: 900, textDecoration: "underline" }}>
          سجّل مجانًا
        </a>
      </div>
    </div>
  );
}

/** Promo bar height used by ERP sticky header offset. */
export const LANDING_HEADER_OFFSET = 50;
