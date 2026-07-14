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
        zIndex: 60,
        background: "linear-gradient(90deg, #3b0a10 0%, #1a0508 50%, #3b0a10 100%)",
        color: "#fecaca",
        fontSize: "0.78rem",
        fontWeight: 600,
        padding: "0.55rem 1rem",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span>عروض محدودة على منظومة نايوش 360 القانونية — </span>
      <Link href="/login" style={{ color: "#fff", fontWeight: 800, textDecoration: "underline" }}>
        ابدأ الآن
      </Link>
      <span> — خصومات على الاشتراك السنوي لفترة محدودة</span>
    </div>
  );
}

export const LANDING_HEADER_OFFSET = 108;
