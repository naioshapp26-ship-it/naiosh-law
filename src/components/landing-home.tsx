"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { EmpireLandingHero } from "@/components/empire-landing-hero";
import { BrandLogo } from "@/components/brand-logo";

const FOOTER_GROUPS = [
  {
    title: "المنصة",
    links: [
      { href: "/#features", label: "المميزات" },
      { href: "/#modules", label: "الوحدات" },
      { href: "/#demo-request", label: "طلب تجريبي" },
    ],
  },
  {
    title: "الوصول السريع",
    links: [
      { href: "/app/modules/case-management", label: "القضايا" },
      { href: "/app/modules/clients-management", label: "الموكلين" },
      { href: "/app/modules/court-sessions", label: "الجلسات" },
      { href: "/app/legal-library", label: "المكتبة" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { href: "/#footer-support", label: "مركز المساعدة" },
      { href: "/login", label: "تسجيل الدخول" },
      { href: "/app/dashboard", label: "لوحة التحكم" },
    ],
  },
];

const FOOTER_ACTIONS = [
  { href: "/login", label: "ابدأ الآن مجانًا", primary: true },
  { href: "/login", label: "دخول النظام", primary: false },
  { href: "/app/dashboard", label: "عرض تجريبي", primary: false },
  { href: "/#modules", label: "استكشف الوحدات", primary: false },
];

export default function LandingHome() {
  return (
    <>
      <LandingPromoBar />
      <Navbar variant="landing" />
      <EmpireLandingHero />

      {/* مراسي خفيفة للأقسام المرتبطة من القائمة — بدون مساحة بيضاء كبيرة */}
      <section id="features" aria-hidden style={{ height: 0, overflow: "hidden" }} />
      <section id="modules" aria-hidden style={{ height: 0, overflow: "hidden" }} />
      <section id="demo-request" aria-hidden style={{ height: 0, overflow: "hidden" }} />

      <footer
        id="footer-support"
        style={{
          background: "linear-gradient(180deg, #1a0508 0%, #0a0a12 100%)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "2.75rem 0 1.75rem",
        }}
      >
        <div className="container-max" style={{ paddingInline: "clamp(1rem, 3vw, 1.5rem)" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.25rem",
              justifyContent: "center",
              marginBottom: "2.25rem",
            }}
          >
            {FOOTER_ACTIONS.map((btn) => (
              <Link
                key={btn.label}
                href={btn.href}
                style={{
                  padding: "0.7rem 1.35rem",
                  borderRadius: 999,
                  fontSize: "0.86rem",
                  fontWeight: 800,
                  background: btn.primary ? "#c3152a" : "transparent",
                  color: "#fff",
                  border: btn.primary ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.28)",
                  boxShadow: btn.primary ? "0 10px 24px rgba(195,21,42,0.35)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {btn.label}
              </Link>
            ))}
          </div>

          <div
            className="landing-footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr repeat(3, 1fr)",
              gap: "2rem",
              alignItems: "start",
              marginBottom: "2rem",
            }}
          >
            <div>
              <BrandLogo href="/" size={44} variant="light" subtitle="النظام القانوني السيادي 360" />
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.86rem",
                  lineHeight: 1.8,
                  marginTop: "1rem",
                  maxWidth: 320,
                }}
              >
                منصة احترافية لمكاتب المحاماة — إدارة القضايا والموكلين والجلسات والمحاسبة في مكان واحد.
              </p>
            </div>

            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h3
                  style={{
                    color: "#fff",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    marginBottom: "0.85rem",
                  }}
                >
                  {group.title}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  {group.links.map((link) => (
                    <Link
                      key={`${group.title}-${link.label}`}
                      href={link.href}
                      style={{
                        color: "#94a3b8",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "1.15rem",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <p style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 600 }}>
              جميع الحقوق محفوظة © 2026 — ناعوش للمحاماة والاستشارات القانونية
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <Link
                href="/login"
                style={{
                  color: "#fecaca",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "0.35rem 0.75rem",
                  borderRadius: 999,
                  border: "1px solid rgba(254,202,202,0.35)",
                }}
              >
                سجّل مجانًا
              </Link>
              <Link
                href="/#footer-support"
                style={{
                  color: "#94a3b8",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "0.35rem 0.75rem",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                }}
              >
                تواصل معنا
              </Link>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .landing-footer-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
          @media (max-width: 560px) {
            .landing-footer-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </footer>
    </>
  );
}
