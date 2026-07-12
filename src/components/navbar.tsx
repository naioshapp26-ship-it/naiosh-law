"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LANDING_HEADER_OFFSET } from "@/components/landing-promo-bar";

type Props = {
  variant?: "dark" | "landing";
};

export function Navbar({ variant = "dark" }: Props) {
  const isLanding = variant === "landing";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLanding) return;
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [isLanding]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (solutionsMenuRef.current && !solutionsMenuRef.current.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const navStyle: React.CSSProperties = isLanding
    ? {
        position: "fixed",
        top: 36,
        insetInline: 0,
        zIndex: 100,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.06)" : "0 1px 0 rgba(0,0,0,0.04)",
        padding: "0.85rem 0",
      }
    : {
        position: "fixed",
        top: 0,
        insetInline: 0,
        zIndex: 100,
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        background: scrolled ? "rgba(10,10,18,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
        padding: scrolled ? "0.85rem 0" : "1.25rem 0",
      };

  const linkColor = isLanding ? "#475569" : "#94a3b8";
  const linkHoverBg = isLanding ? "rgba(195,21,42,0.06)" : "rgba(255,255,255,0.06)";
  const linkHoverColor = isLanding ? "#c3152a" : "#ffffff";

  const links = [
    { href: "/#modules", label: "المنتجات" },
    { href: "/#footer-support", label: "الدعم الفني" },
    { href: "/#demo-request", label: "طلب تجريبي" },
    { href: "/#features", label: "المميزات" },
    { href: "/#modules", label: "الوحدات" },
    { href: "/app/dashboard", label: "عرض تجريبي" },
  ];

  const solutionItems = [
    { href: "/app/modules/case-management", label: "حل إدارة القضايا" },
    { href: "/app/modules/clients-management", label: "حل إدارة الموكلين" },
    { href: "/app/modules/court-sessions", label: "حل الجلسات والمتابعات" },
    { href: "/app/modules/legal-accounting", label: "حل المحاسبة القانونية" },
  ];

  const utilityButtons = isLanding ? (
  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
      <Link
        href="/login"
        style={{
          padding: "0.45rem 0.9rem",
          borderRadius: "999px",
          border: "1px solid #e2e8f0",
          color: "#475569",
          fontSize: "0.8rem",
          fontWeight: 700,
        }}
      >
        تسجيل الدخول
      </Link>
      <Link
        href="/login"
        className="btn-primary"
        style={{ padding: "0.5rem 1.15rem", fontSize: "0.8rem" }}
      >
        دخول النظام
      </Link>
    </div>
  ) : (
    <Link
      href="/login"
      className="btn-primary"
      style={{ padding: "0.55rem 1.4rem", fontSize: "0.875rem", marginInlineStart: "0.5rem" }}
    >
      دخول النظام
    </Link>
  );

  return (
    <>
      {isLanding && (
        <div style={{ position: "fixed", top: 0, insetInline: 0, zIndex: 110 }}>
          <div
            style={{
              background: "linear-gradient(90deg, #3b0a10 0%, #1a0508 50%, #3b0a10 100%)",
              color: "#fecaca",
              fontSize: "0.78rem",
              fontWeight: 600,
              padding: "0.55rem 1rem",
              textAlign: "center",
            }}
          >
            عروض محدودة على منظومة نايوش 360 —{" "}
            <Link href="/login" style={{ color: "#fff", fontWeight: 800, textDecoration: "underline" }}>
              ابدأ الآن
            </Link>
          </div>
        </div>
      )}

      <header style={navStyle}>
        <div
          className="container-max"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
        >
          <BrandLogo
            href="/"
            size={48}
            showText={isLanding}
            variant={isLanding ? "dark" : "light"}
            subtitle={isLanding ? "النظام القانوني السيادي 360" : undefined}
          />

          <nav style={{ display: "flex", alignItems: "center", gap: "0.15rem" }} className="desktop-nav">
            <div ref={solutionsMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setSolutionsOpen((prev) => !prev)}
                style={{
                  color: linkColor,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  padding: "0.45rem 0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  background: solutionsOpen ? linkHoverBg : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-cairo)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span>الحلول</span>
                <span style={{ fontSize: "0.65rem" }}>{solutionsOpen ? "▲" : "▼"}</span>
              </button>
              {solutionsOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 0.45rem)",
                    insetInlineEnd: 0,
                    minWidth: "240px",
                    background: isLanding ? "#fff" : "rgba(10,10,18,0.96)",
                    border: isLanding ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.09)",
                    borderRadius: "12px",
                    padding: "0.45rem",
                    boxShadow: "0 18px 45px rgba(0,0,0,0.12)",
                  }}
                >
                  {solutionItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSolutionsOpen(false)}
                      style={{
                        display: "block",
                        padding: "0.55rem 0.65rem",
                        borderRadius: "8px",
                        color: isLanding ? "#475569" : "#cbd5e1",
                        fontSize: "0.82rem",
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {links.map((l) => (
              <Link
                key={`${l.href}-${l.label}`}
                href={l.href}
                style={{
                  color: linkColor,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  padding: "0.45rem 0.75rem",
                  borderRadius: "8px",
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = linkHoverColor;
                  (e.currentTarget as HTMLElement).style.background = linkHoverBg;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = linkColor;
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {l.label}
              </Link>
            ))}
            {utilityButtons}
          </nav>

          <button
            onClick={() => {
              setMenuOpen((prev) => {
                const next = !prev;
                if (!next) setMobileSolutionsOpen(false);
                return next;
              });
            }}
            style={{
              display: "none",
              background: isLanding ? "#f8fafc" : "rgba(255,255,255,0.07)",
              border: isLanding ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              padding: "0.5rem",
              cursor: "pointer",
              color: isLanding ? "#0a0a12" : "#ffffff",
            }}
            className="mobile-menu-btn"
            aria-label="قائمة"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {menuOpen ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div
            style={{
              background: isLanding ? "#fff" : "rgba(10,10,18,0.97)",
              borderTop: isLanding ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.07)",
              padding: "1.25rem",
            }}
          >
            {links.map((l) => (
              <Link
                key={`${l.href}-${l.label}`}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "0.75rem 0.5rem",
                  color: isLanding ? "#475569" : "#94a3b8",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  borderBottom: isLanding ? "1px solid #f1f5f9" : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: "1rem" }}>
              دخول النظام
            </Link>
          </div>
        )}
      </header>

      {isLanding && <div style={{ height: LANDING_HEADER_OFFSET }} aria-hidden />}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
