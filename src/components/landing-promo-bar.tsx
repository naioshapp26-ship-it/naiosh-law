"use client";

/**
 * شريط العروض — بيانات منظومة نايوش القانونية.
 * الكلمات تُرتَّب بصريًا من اليسار→اليمين (أول كلمة = الحافة الأمامية)
 * حتى تدخل «ابدأ» من اليمنى أولًا مع حركة translateX(100%→-100%).
 * كل كلمة تبقى dir=rtl للحفاظ على التشكيل وعلامات الترقيم.
 */
const PROMO_TOKENS: Array<{ text: string; href?: string }> = [
  { text: "ابدأ" },
  { text: "الآن" },
  { text: "|" },
  { text: "عروض" },
  { text: "محدودة" },
  { text: "على" },
  { text: "منظومة" },
  { text: "نايوش" },
  { text: "القانونية" },
  { text: "360" },
  { text: "—" },
  { text: "سجّل مجانًا", href: "/login" },
];

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
          {PROMO_TOKENS.map((token, i) =>
            token.href ? (
              <a
                key={`t-${i}`}
                className="announcement-token"
                dir="rtl"
                href={token.href}
                style={{ color: "#fecaca", fontWeight: 900, textDecoration: "underline" }}
              >
                {token.text}
              </a>
            ) : (
              <span key={`t-${i}`} className="announcement-token" dir="rtl">
                {token.text}
              </span>
            )
          )}
        </span>
      </div>
    </div>
  );
}

/** Promo bar height used by ERP sticky header offset. */
export const LANDING_HEADER_OFFSET = 50;
