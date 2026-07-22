"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { DarkModeToggle } from "@/components/color-mode";
import { useSiteTheme } from "@/components/theme-provider";
import { DEFAULT_PUBLIC_LOGO } from "@/lib/site-settings";
import { NAIOSH_OWNERSHIP_MENU } from "@/data/naiosh-ownership-menu";

type Props = {
  variant?: "dark" | "landing";
};

const LANDING_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/#modules", label: "منتجاتنا" },
  { href: "/services", label: "خدماتنا" },
  { href: "/branches", label: "الفروع" },
  { href: "/platforms", label: "المنصات" },
  { href: "/ads", label: "الإعلانات" },
  { href: "/login", label: "العضوية" },
  { href: "/#features", label: "المدونة" },
  { href: "/#modules", label: "الأسعار" },
  { href: "/#footer-support", label: "اتصل بنا" },
  { href: "/#footer-support", label: "مركز المعلومات", icon: "fa-info-circle", className: "nav-info-center" },
  { href: "/register", label: "سجل مجانًا", icon: "fa-user-plus", className: "nav-register-with-us" },
];

type OwnershipMenuPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

/**
 * Landing navbar uses ERP `/newhome` top-nav chrome exactly.
 * Auth pill order matches ERP: أنشئ صفحتك · استأجر نظام الآن · صفحتي · تسجيل الدخول · إنشاء حساب
 */
export function Navbar({ variant = "dark" }: Props) {
  const pathname = usePathname();
  const { logoSrc } = useSiteTheme();
  const headerLogoSrc = logoSrc?.trim() || DEFAULT_PUBLIC_LOGO;
  const isLanding = variant === "landing";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownershipOpen, setOwnershipOpen] = useState(false);
  const [ownershipPos, setOwnershipPos] = useState<OwnershipMenuPos | null>(null);
  const ownershipWrapRef = useRef<HTMLDivElement>(null);
  const ownershipBtnRef = useRef<HTMLButtonElement>(null);
  const ownershipMenuRef = useRef<HTMLDivElement>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [myPageHref, setMyPageHref] = useState("/my-page");
  const [logoFailed, setLogoFailed] = useState(false);
  const resolvedLogoSrc = logoFailed ? DEFAULT_PUBLIC_LOGO : headerLogoSrc;

  useEffect(() => {
    setLogoFailed(false);
  }, [headerLogoSrc]);

  const isLinkActive = (href: string, label: string) => {
    if (label === "خدماتنا") return pathname === "/services" || pathname.startsWith("/services/");
    if (label === "الفروع") return pathname === "/branches" || pathname.startsWith("/branches/");
    if (label === "المنصات") return pathname === "/platforms" || pathname.startsWith("/platforms/");
    if (label === "الإعلانات") return pathname === "/ads" || pathname.startsWith("/ads/");
    if (label === "الرئيسية") return pathname === "/";
    return false;
  };

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

  const updateOwnershipPos = () => {
    const btn = ownershipBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 8;
    const menuWidth = Math.max(240, Math.min(320, rect.width + 40));
    const viewportPadding = 12;
    const preferredLeft = rect.right - menuWidth;
    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      window.innerWidth - menuWidth - viewportPadding
    );
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const spaceAbove = rect.top - gap - viewportPadding;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, Math.min(520, openUp ? spaceAbove : spaceBelow));
    const top = openUp ? Math.max(viewportPadding, rect.top - gap - maxHeight) : rect.bottom + gap;
    setOwnershipPos({ top, left, width: menuWidth, maxHeight });
  };

  useLayoutEffect(() => {
    if (!ownershipOpen) {
      setOwnershipPos(null);
      return;
    }
    updateOwnershipPos();
  }, [ownershipOpen, menuOpen]);

  useEffect(() => {
    if (!ownershipOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (ownershipWrapRef.current?.contains(target)) return;
      if (ownershipMenuRef.current?.contains(target)) return;
      setOwnershipOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOwnershipOpen(false);
    };

    const onReposition = () => updateOwnershipPos();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [ownershipOpen]);

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
              <img
                id="site-logo-header"
                key={resolvedLogoSrc}
                src={resolvedLogoSrc}
                alt="شعار نايوش"
                onError={() => {
                  if (!logoFailed) setLogoFailed(true);
                }}
              />
              <span className="logo-text">NAIOSH Law</span>
            </Link>
            <nav className="nav-links" aria-label="روابط الصفحات">
              <span className="nav-active-indicator" id="nav-active-indicator" aria-hidden="true" />
              {LANDING_LINKS.map((link) => {
                const active = isLinkActive(link.href, link.label);
                return (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className={[link.className, active ? "active" : ""].filter(Boolean).join(" ") || undefined}
                    aria-label={link.label}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      setOwnershipOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    {link.icon ? <i className={`fas ${link.icon}`} aria-hidden="true" /> : null}
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <div
                className={`nav-dropdown nav-ownership${ownershipOpen ? " is-open" : ""}`}
                ref={ownershipWrapRef}
              >
                <button
                  type="button"
                  ref={ownershipBtnRef}
                  className="nav-ownership-btn"
                  aria-label="ملكية نايوش"
                  aria-haspopup="menu"
                  aria-expanded={ownershipOpen}
                  aria-controls="naiosh-ownership-menu"
                  onClick={() => {
                    if (ownershipOpen) {
                      setOwnershipOpen(false);
                      return;
                    }
                    updateOwnershipPos();
                    setOwnershipOpen(true);
                  }}
                >
                  <i className="fas fa-copyright" aria-hidden="true" />
                  <span>ملكية نايوش</span>
                </button>
              </div>
            </nav>
          </div>

          {typeof document !== "undefined" &&
          ownershipOpen &&
          ownershipPos &&
          createPortal(
            <div
              id="naiosh-ownership-menu"
              ref={ownershipMenuRef}
              className="nav-dropdown-menu nav-ownership-menu is-open"
              role="menu"
              aria-label="قائمة ملكية نايوش"
              style={{
                position: "fixed",
                top: ownershipPos.top,
                left: ownershipPos.left,
                width: ownershipPos.width,
                maxHeight: ownershipPos.maxHeight,
                zIndex: 5000,
              }}
            >
              {NAIOSH_OWNERSHIP_MENU.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  role="menuitem"
                  onClick={() => {
                    setOwnershipOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>,
            document.body
          )}

          <Link href="/login" className="mobile-header-login" aria-label="تسجيل الدخول">
            دخول
          </Link>

          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            onClick={() => {
              setOwnershipOpen(false);
              setMenuOpen((v) => !v);
            }}
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
          <img
            src={resolvedLogoSrc}
            alt="شعار نايوش"
            style={{ height: 72, width: "auto", objectFit: "contain", display: "block" }}
            onError={() => {
              if (!logoFailed) setLogoFailed(true);
            }}
          />
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
