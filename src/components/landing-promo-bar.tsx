"use client";

import Link from "next/link";

export function LandingPromoBar() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 110,
        background: "linear-gradient(90deg, #7f1d1d 0%, #450a0a 50%, #7f1d1d 100%)",
        color: "#fff",
        fontSize: "0.8rem",
        fontWeight: 700,
        padding: "0.55rem 1rem",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span>ابدأ الآن | عروض محدودة على منظومة نايوش القانونية 360 — </span>
      <Link href="/login" style={{ color: "#fecaca", fontWeight: 900, textDecoration: "underline" }}>
        سجّل مجانًا
      </Link>
    </div>
  );
}

/** Promo bar (~36px) + compact single-row navbar (~64px). */
export const LANDING_HEADER_OFFSET = 100;
