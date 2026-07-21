"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DarkModeToggle } from "@/components/color-mode";

type Props = {
  variant?: "dark" | "landing";
};

const LANDING_LINKS = [
  { href: "/", label: "الرئيسية", active: true },
  { href: "/#modules", label: "منتجاتنا" },
  { href: "/#features", label: "خدماتنا" },
  { href: "/app/modules/administration", label: "الفروع" },
  { href: "/app/dashboard", label: "المنصات" },
  { href: "/#demo-request", label: "الإعلانات" },
  { href: "/login", label: "العضوية" },
  { href: "/#features", label: "المدونة" },
  { href: "/#modules", label: "الأسعار" },
  { href: "/#footer-support", label: "اتصل بنا" },
  { href: "/#footer-support", label: "مركز المعلومات", icon: "fa-info-circle", className: "nav-info-center" },
  { href: "/register", label: "سجل مجانًا", icon: "fa-user-plus", className: "nav-register-with-us" },
];

/**
 * Landing navbar uses ERP `/newhome` top-nav chrome exactly.
 * Auth pill order matches ERP: أنشئ صفحتك · استأجر نظام الآن · صفحتي · تسجيل الدخول · إنشاء حساب
 */
export function Navbar({ variant = "dark" }: Props) {
  const isLanding = variant === "landing";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [myPageHref, setMyPageHref] = useState("/my-page");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (cancelled) return;
        const name = data?.user?.name ? String(data.user.name) : null;
        setSessionName(name);
        if (!name) {
          setMyPageHref("/my-page");
          return;
        }
        try {
          const pageRes = await fetch("/api/creator-pages/me", { credentials: "include" });
          if (!pageRes.ok) return;
          const pageData = await pageRes.json();
          const username = pageData?.page?.username;
          if (username) setMyPageHref(`/u/${encodeURIComponent(username)}`);
          else setMyPageHref("/my-page");
        } catch {
          setMyPageHref("/my-page");
        }
      })
      .catch(() => {
        if (!cancelled) setSessionName(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLanding) return;
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [isLanding]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    window.location.assign("/login");
  };

  const darkNavStyle = useMemo<React.CSSProperties>(
    () => ({
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
    }),
    [scrolled]
  );

  if (isLanding) {
    return (
      <header className={`top-nav${menuOpen ? " is-mobile-nav-open is-mobile-nav-ready" : " is-mobile-nav-ready"}`}>
        <div className="container inner">
          <div className="nav-main">
            <Link className="brand" href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img id="site-logo-header" src="/naiosh-logo.png" alt="شعار نايوش" />
              <span className="logo-text">NAIOSH Law</span>
            </Link>
            <nav className="nav-links" aria-label="روابط الصفحات">
              <span className="nav-active-indicator" id="nav-active-indicator" aria-hidden="true" />
              {LANDING_LINKS.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={[link.className, link.active ? "active" : ""].filter(Boolean).join(" ") || undefined}
                  aria-label={link.label}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.icon ? <i className={`fas ${link.icon}`} aria-hidden="true" /> : null}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/login" className="mobile-header-login" aria-label="تسجيل الدخول">
            دخول
          </Link>

          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className={`fas ${menuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
          </button>

          <div className="auth-actions-shell" aria-label="إجراءات الحساب">
            <div className="auth-actions">
              <DarkModeToggle />
              <Link href="/create-page" className="auth-btn magnetic-btn">
                أنشئ صفحتك
              </Link>
              <Link href="/rent-system" className="auth-btn magnetic-btn auth-btn-primary" style={{ background: "#d70000", color: "#fff", borderColor: "#d70000" }}>
                استأجر نظام الآن
              </Link>
              <Link href={myPageHref} className="auth-btn magnetic-btn" id="my-page-nav-btn">
                صفحتي
              </Link>
              {sessionName ? (
                <>
                  <Link href="/app/dashboard" className="auth-btn magnetic-btn">
                    لوحة التحكم
                  </Link>
                  <button type="button" className="auth-btn magnetic-btn" onClick={logout} style={{ cursor: "pointer", fontFamily: "inherit" }}>
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="auth-btn magnetic-btn">
                    تسجيل الدخول
                  </Link>
                  <Link href="/register" className="auth-btn magnetic-btn">
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header style={darkNavStyle}>
      <div
        className="container-max"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <Link href="/" className="brand" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/naiosh-logo.png" alt="شعار نايوش" style={{ height: 48, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <DarkModeToggle />
          <Link href="/login" className="btn-primary" style={{ padding: "0.55rem 1.4rem", fontSize: "0.875rem" }}>
            دخول النظام
          </Link>
        </div>
      </div>
    </header>
  );
}
