"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getVisibleOperationalModules } from "@/data/modules";
import { moduleIconMap } from "@/data/module-icons";
import { useSession } from "@/lib/session";

type Props = {
  role: "admin" | "client";
  name: string;
  children: React.ReactNode;
};

type SidebarContentProps = {
  pathname: string;
  role: Props["role"];
  onClose: () => void;
};

const roleLabels: Record<Props["role"], string> = {
  admin: "مدير النظام",
  client: "عميل",
};

const preferredBottomModuleSlugs = ["case-management", "court-sessions", "legal-accounting"];
const bottomModuleLabels: Record<string, string> = {
  "case-management": "القضايا",
  "court-sessions": "الجلسات",
  "legal-accounting": "المالية",
};

function SidebarContent({ pathname, role, onClose }: SidebarContentProps) {
  const isActive = (href: string) => pathname === href;
  const visibleModules = getVisibleOperationalModules(role);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo inside drawer (mobile) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 0.75rem",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "0.5rem",
        }}
        className="drawer-header"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg,#c3152a,#7f0d1a)",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              fontSize: "0.9rem",
            }}
          >N</div>
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0a0a12" }}>Naiosh Law</span>
        </div>
        <button
          onClick={onClose}
          className="drawer-close-btn"
          aria-label="إغلاق القائمة"
          style={{
            width: 32, height: 32, border: "1px solid #e2e8f0",
            borderRadius: "8px", background: "#f8f9fb", cursor: "pointer",
            fontSize: "0.9rem", color: "#64748b",
          }}
        >✕</button>
      </div>

      {/* Dashboard link */}
      <div style={{ padding: "0 0.75rem", marginBottom: "0.25rem" }}>
        <Link
          href="/app/dashboard"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.6rem 0.75rem", borderRadius: "10px",
            fontSize: "0.85rem", fontWeight: isActive("/app/dashboard") ? 700 : 500,
            color: isActive("/app/dashboard") ? "#c3152a" : "#64748b",
            background: isActive("/app/dashboard") ? "rgba(195,21,42,0.08)" : "transparent",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "1rem" }}>{moduleIconMap.dashboard}</span>
          <span>لوحة التحكم</span>
        </Link>
      </div>

      {/* Section label */}
      <p style={{
        fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8",
        letterSpacing: "0.06em", textTransform: "uppercase",
        padding: "0.75rem 1.5rem 0.35rem",
      }}>
        الوحدات التشغيلية
      </p>

      {/* Module links */}
      <nav
        style={{
          flex: 1, overflowY: "auto", padding: "0 0.75rem",
          display: "flex", flexDirection: "column", gap: "2px",
        }}
      >
        {visibleModules.map((item) => {
          const href = `/app/modules/${item.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={item.slug}
              href={href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.6rem 0.75rem", borderRadius: "10px",
                fontSize: "0.84rem", fontWeight: active ? 700 : 500,
                color: active ? "#c3152a" : "#64748b",
                background: active ? "rgba(195,21,42,0.08)" : "transparent",
                textDecoration: "none", transition: "all 0.15s",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{moduleIconMap[item.slug] ?? "📌"}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      <div style={{ padding: "0.75rem" }}>
        <div style={{
          background: "rgba(195,21,42,0.05)", border: "1px solid rgba(195,21,42,0.1)",
          borderRadius: "12px", padding: "0.85rem",
        }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#c3152a", marginBottom: "0.2rem" }}>
            {roleLabels[role]}
          </p>
          <p style={{ fontSize: "0.67rem", color: "#64748b", lineHeight: 1.5 }}>
            {role === "admin" ? "صلاحية كاملة على النظام" : "عرض الحالة والمستندات"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ role, name, children }: Props) {
  const pathname = usePathname();
  const { logout } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const lastDrawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerWasOpenRef = useRef(false);
  const bottomModuleItems = getVisibleOperationalModules(role)
    .filter((item) => preferredBottomModuleSlugs.includes(item.slug))
    .slice(0, 3);
  const bottomNavItems = [
    { href: "/app/dashboard", icon: moduleIconMap.dashboard, label: "الرئيسية" },
    ...bottomModuleItems.map((item) => ({
      href: `/app/modules/${item.slug}`,
      icon: moduleIconMap[item.slug] ?? "📌",
      label: bottomModuleLabels[item.slug] ?? item.title,
    })),
  ];

  const openDrawer = (trigger: HTMLButtonElement) => {
    lastDrawerTriggerRef.current = trigger;
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen) {
      drawerWasOpenRef.current = true;
      return;
    }

    if (drawerWasOpenRef.current) {
      lastDrawerTriggerRef.current?.focus();
      drawerWasOpenRef.current = false;
    }
  }, [drawerOpen]);

  const handleLogout = async () => {
    if (logoutPending) {
      return;
    }

    setLogoutPending(true);
    setLogoutError("");

    try {
      await logout();
    } catch {
      setLogoutError("تعذر تسجيل الخروج. تحقق من الاتصال ثم حاول مرة أخرى.");
      setLogoutPending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9", display: "flex", flexDirection: "column" }}>

      {/* ── Top Header ── */}
      <header style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          gap: "0.75rem",
        }}>
          {/* Left: Hamburger (mobile) + Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            {/* Hamburger — mobile only */}
            <button
              onClick={(event) => openDrawer(event.currentTarget)}
              className="hamburger-btn"
              style={{
                width: 38, height: 38, border: "1px solid #e2e8f0",
                borderRadius: "10px", background: "#f8f9fb",
                cursor: "pointer", display: "none",
                alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", color: "#475569", flexShrink: 0,
              }}
              aria-label="القائمة"
              aria-expanded={drawerOpen}
              aria-controls="app-mobile-drawer"
            >
              ☰
            </button>

            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
              <div style={{
                width: 34, height: 34, flexShrink: 0,
                background: "linear-gradient(135deg,#c3152a,#7f0d1a)",
                borderRadius: "10px", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 900, color: "#fff",
                fontSize: "0.95rem", boxShadow: "0 3px 10px rgba(195,21,42,0.3)",
              }}>N</div>
              <div className="logo-text">
                <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.2 }}>Naiosh Law</div>
                <div style={{ color: "#94a3b8", fontSize: "0.58rem" }}>لوحة التحكم</div>
              </div>
            </Link>
          </div>

          {/* Right: User + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
            {/* User chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "#f8f9fb", border: "1px solid #e2e8f0",
              borderRadius: "10px", padding: "0.4rem 0.75rem",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "7px",
                background: "rgba(195,21,42,0.1)", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "0.8rem",
              }}>
                {role === "admin" ? "⚙️" : "👤"}
              </div>
              <div className="user-name-block">
                <div style={{ color: "#0a0a12", fontSize: "0.75rem", fontWeight: 700, lineHeight: 1.2 }}>{name}</div>
                <div style={{ color: "#94a3b8", fontSize: "0.58rem" }}>{roleLabels[role]}</div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={logoutPending}
              style={{
                background: "rgba(195,21,42,0.07)", border: "1px solid rgba(195,21,42,0.15)",
                borderRadius: "9px", padding: "0.4rem 0.75rem",
                color: "#c3152a", fontSize: "0.75rem", fontWeight: 700,
                cursor: logoutPending ? "not-allowed" : "pointer", fontFamily: "var(--font)",
                transition: "all 0.2s", whiteSpace: "nowrap", opacity: logoutPending ? 0.65 : 1,
              }}
              onMouseEnter={(e) => {
                if (!logoutPending) {
                  (e.currentTarget as HTMLElement).style.background = "#c3152a";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.07)";
                (e.currentTarget as HTMLElement).style.color = "#c3152a";
              }}
            >
              {logoutPending ? "جارٍ..." : "خروج"}
            </button>
          </div>
        </div>
      </header>

      {logoutError ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "4.5rem",
            insetInline: "1rem",
            zIndex: 120,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "#c3152a",
              color: "#fff",
              borderRadius: "12px",
              padding: "0.75rem 1rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              boxShadow: "0 12px 35px rgba(195,21,42,0.25)",
            }}
          >
            {logoutError}
          </div>
        </div>
      ) : null}

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── Desktop Sidebar ── */}
        <aside className="desktop-sidebar" style={{
          width: 255, background: "#ffffff",
          borderInlineEnd: "1px solid #e2e8f0",
          overflowY: "auto", flexShrink: 0,
        }}>
          <SidebarContent pathname={pathname} role={role} onClose={() => {}} />
        </aside>

        {/* ── Mobile Drawer Overlay ── */}
        {drawerOpen && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              display: "flex",
              justifyContent: "flex-start",
              direction: "rtl",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
          >
            {/* Backdrop */}
            <div
              onClick={closeDrawer}
              style={{ position: "absolute", inset: 0, background: "rgba(10,10,18,0.5)", backdropFilter: "blur(2px)" }}
              aria-hidden="true"
            />
            {/* Drawer panel */}
            <div id="app-mobile-drawer" className="mobile-drawer-panel" style={{
              position: "relative", zIndex: 1,
              width: "min(280px, calc(100vw - 2rem))", background: "#ffffff",
              height: "100%", overflowY: "auto",
              boxShadow: "-4px 0 30px rgba(0,0,0,0.15)",
              overscrollBehavior: "contain",
              animation: "slide-drawer 0.25s ease",
            }}>
              <SidebarContent pathname={pathname} role={role} onClose={closeDrawer} />
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: "1.25rem", minWidth: 0, overflowX: "hidden" }}>
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="mobile-bottom-nav" style={{
        display: "none", position: "fixed", bottom: 0, insetInline: 0,
        background: "#ffffff", borderTop: "1px solid #e2e8f0",
        padding: "0.5rem 0.75rem calc(0.5rem + env(safe-area-inset-bottom))",
        zIndex: 100,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        justifyContent: "space-around",
      }}>
        {bottomNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "0.2rem", padding: "0.4rem 0.6rem", borderRadius: "10px",
                textDecoration: "none", flex: 1, minWidth: 0,
                background: active ? "rgba(195,21,42,0.08)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: active ? 700 : 500, color: active ? "#c3152a" : "#94a3b8", width: "100%", maxWidth: "5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal", lineHeight: 1.25, textAlign: "center" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* All modules button */}
        <button
          onClick={(event) => openDrawer(event.currentTarget)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "0.2rem", padding: "0.4rem 0.6rem", borderRadius: "10px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font)", flex: 1, minWidth: 0,
          }}
          aria-label="عرض كل الوحدات"
          aria-expanded={drawerOpen}
          aria-controls="app-mobile-drawer"
        >
          <span style={{ fontSize: "1.2rem" }}>☰</span>
          <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "#94a3b8" }}>الكل</span>
        </button>
      </nav>

      <style>{`
        /* Mobile breakpoint */
        @media (max-width: 900px) {
          .desktop-sidebar   { display: none !important; }
          .hamburger-btn     { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .logo-text         { display: none; }
          .user-name-block   { display: none; }
          .drawer-header     { display: flex !important; }
          main               { padding: 1rem !important; padding-bottom: calc(5.5rem + env(safe-area-inset-bottom)) !important; }
        }
        @media (max-width: 420px) {
          header button:not(.hamburger-btn) { padding-inline: 0.6rem !important; }
        }
        @media (min-width: 901px) {
          .drawer-close-btn  { display: none; }
          .drawer-header     { display: none; }
        }
        @keyframes slide-drawer {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mobile-drawer-panel {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
