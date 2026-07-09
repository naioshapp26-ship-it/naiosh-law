"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/lib/use-scroll-lock";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (solutionsMenuRef.current && !solutionsMenuRef.current.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSolutionsOpen(false);
        setMobileSolutionsOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useScrollLock(menuOpen);

  const navStyle: React.CSSProperties = {
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

  const links = [
    { href: "/#modules", label: "المنتجات" },
    { href: "/#footer-support", label: "الدعم الفني" },
    { href: "/#demo-request", label: "طلب تجريبي" },
    { href: "/#features", label: "المميزات" },
    { href: "/#modules", label: "الوحدات" },
    { href: `/login?next=${encodeURIComponent("/app/dashboard")}`, label: "عرض تجريبي" },
  ];

  const solutionItems = [
    { href: `/login?next=${encodeURIComponent("/app/modules/case-management")}`, label: "حل إدارة القضايا" },
    { href: `/login?next=${encodeURIComponent("/app/modules/clients-management")}`, label: "حل إدارة الموكلين" },
    { href: `/login?next=${encodeURIComponent("/app/modules/court-sessions")}`, label: "حل الجلسات والمتابعات" },
    { href: `/login?next=${encodeURIComponent("/app/modules/legal-accounting")}`, label: "حل المحاسبة القانونية" },
  ];

  return (
    <header style={navStyle}>
      <div
        className="container-max"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, #c3152a 0%, #7f0d1a 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              color: "#fff",
              fontSize: "1.15rem",
              boxShadow: "0 4px 14px rgba(195,21,42,0.4)",
              flexShrink: 0,
            }}
          >
            N
          </div>
          <div>
            <div
              style={{
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "1.05rem",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              Naiosh Law
            </div>
            <div style={{ color: "#475569", fontSize: "0.65rem", fontWeight: 500 }}>
              النظام القانوني المتكامل
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          className="desktop-nav"
        >
          <div ref={solutionsMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setSolutionsOpen((prev) => !prev)}
              aria-expanded={solutionsOpen}
              aria-haspopup="menu"
              style={{
                color: "#94a3b8",
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "0.45rem 0.9rem",
                borderRadius: "8px",
                border: "none",
                background: solutionsOpen ? "rgba(255,255,255,0.06)" : "transparent",
                transition: "color 0.2s, background 0.2s",
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>الحلول</span>
              <span style={{ fontSize: "0.7rem" }}>{solutionsOpen ? "▲" : "▼"}</span>
            </button>
            {solutionsOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.45rem)",
                  insetInlineEnd: 0,
                  minWidth: "240px",
                  background: "rgba(10,10,18,0.96)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "12px",
                  padding: "0.45rem",
                  boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
                  backdropFilter: "blur(10px)",
                }}
                role="menu"
              >
                {solutionItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSolutionsOpen(false)}
                    role="menuitem"
                    style={{
                      display: "block",
                      padding: "0.55rem 0.65rem",
                      borderRadius: "8px",
                      color: "#cbd5e1",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.18)";
                      (e.currentTarget as HTMLElement).style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#cbd5e1";
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
                color: "#94a3b8",
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "0.45rem 0.9rem",
                borderRadius: "8px",
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="btn-primary"
            style={{ padding: "0.55rem 1.4rem", fontSize: "0.875rem", marginInlineStart: "0.5rem" }}
          >
            دخول النظام
          </Link>
        </nav>

        {/* Mobile menu button */}
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
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            padding: "0.5rem",
            cursor: "pointer",
            color: "#ffffff",
          }}
          className="mobile-menu-btn"
          aria-label="قائمة"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {menuOpen ? (
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            background: "rgba(10,10,18,0.97)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "1.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => setMobileSolutionsOpen((prev) => !prev)}
            aria-expanded={mobileSolutionsOpen}
            style={{
              width: "100%",
              textAlign: "right",
              padding: "0.75rem 0.5rem",
              color: "#94a3b8",
              fontSize: "0.95rem",
              fontWeight: 600,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "transparent",
              borderTop: "none",
              borderInline: "none",
              fontFamily: "var(--font-cairo)",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>الحلول</span>
            <span style={{ fontSize: "0.7rem" }}>{mobileSolutionsOpen ? "▲" : "▼"}</span>
          </button>
          {mobileSolutionsOpen && (
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0.2rem 0 0.55rem" }}>
              {solutionItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setMobileSolutionsOpen(false);
                    setMenuOpen(false);
                  }}
                  style={{
                    display: "block",
                    padding: "0.55rem 1rem",
                    color: "#cbd5e1",
                    fontSize: "0.88rem",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          {links.map((l) => (
            <Link
              key={`${l.href}-${l.label}`}
              href={l.href}
              onClick={() => {
                setMobileSolutionsOpen(false);
                setMenuOpen(false);
              }}
              style={{
                display: "block",
                padding: "0.75rem 0.5rem",
                color: "#94a3b8",
                fontSize: "0.95rem",
                fontWeight: 500,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="btn-primary"
            style={{ display: "block", textAlign: "center", marginTop: "1rem" }}
          >
            دخول النظام
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
