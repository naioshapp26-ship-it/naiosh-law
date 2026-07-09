"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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

function SidebarContent({ pathname, role, onClose }: SidebarContentProps) {
  const isActive = (href: string) => pathname === href;
  const visibleModules = useMemo(() => getVisibleOperationalModules(role), [role]);

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
  const [logoutError, setLogoutError] = useState("");
  const visibleModules = useMemo(() => getVisibleOperationalModules(role), [role]);
  const bottomNavItems = useMemo(() => {
    const moduleItems = preferredBottomModuleSlugs
      .map((slug) => visibleModules.find((moduleItem) => moduleItem.slug === slug))
      .filter((moduleItem): moduleItem is (typeof visibleModules)[number] => Boolean(moduleItem))
      .map((moduleItem) => ({
        href: `/app/modules/${moduleItem.slug}`,
        icon: moduleIconMap[moduleItem.slug] ?? "📌",
        label: moduleItem.title.replace(/^إدارة\s/u, "").replace(/^المحاسبة القانونية$/u, "المالية"),
      }));

    return [
      { href: "/app/dashboard", icon: "⊞", label: "الرئيسية" },
      ...moduleItems,
    ];
  }, [visibleModules]);

  const handleLogout = useCallback(() => {
    setLogoutError("");
    logout().catch(() => {
      setLogoutError("تعذر تسجيل الخروج. تحقق من الاتصال ثم حاول مرة أخرى.");
    });
  }, [logout]);

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

  return (
    <div style={{ minHeight: "100dvh", background: "#f4f6f9", display: "flex", flexDirection: "column" }}>

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
              onClick={() => setDrawerOpen(true)}
              className="hamburger-btn"
              type="button"
              style={{
                width: 38, height: 38, border: "1px solid #e2e8f0",
                borderRadius: "10px", background: "#f8f9fb",
                cursor: "pointer", display: "none",
                alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", color: "#475569", flexShrink: 0,
              }}
              aria-label="القائمة"
              aria-expanded={drawerOpen}
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

          {/* Right: Notifications + User + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
            {/* Notification bell */}
            <button type="button" style={{
              width: 36, height: 36, borderRadius: "10px",
              background: "#f8f9fb", border: "1px solid #e2e8f0",
              cursor: "default", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "0.9rem", position: "relative",
              flexShrink: 0, opacity: 0.8,
            }} aria-label="التنبيهات" aria-disabled="true">
              🔔
              <span style={{
                position: "absolute", top: 6, insetInlineEnd: 6,
                width: 7, height: 7, borderRadius: "50%",
                background: "#c3152a", border: "1.5px solid #fff",
              }} />
            </button>

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
              type="button"
              onClick={handleLogout}
              style={{
                background: "rgba(195,21,42,0.07)", border: "1px solid rgba(195,21,42,0.15)",
                borderRadius: "9px", padding: "0.4rem 0.75rem",
                color: "#c3152a", fontSize: "0.75rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--font)",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#c3152a"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.07)"; (e.currentTarget as HTMLElement).style.color = "#c3152a"; }}
            >
              خروج
            </button>
          </div>
        </div>
        {logoutError ? (
          <div
            role="alert"
            style={{
              background: "rgba(195,21,42,0.08)",
              borderTop: "1px solid rgba(195,21,42,0.12)",
              color: "#9f1239",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.5rem 1rem",
              textAlign: "center",
            }}
          >
            {logoutError}
          </div>
        ) : null}
      </header>

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
            }}
            role="presentation"
          >
            {/* Backdrop */}
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(10,10,18,0.5)", backdropFilter: "blur(2px)" }}
            />
            {/* Drawer panel */}
            <div style={{
              position: "absolute", zIndex: 1, insetBlock: 0, insetInlineStart: 0,
              width: "min(280px, calc(100vw - 2rem))", background: "#ffffff",
              height: "100%", overflowY: "auto",
              boxShadow: "-4px 0 30px rgba(0,0,0,0.15)",
              animation: "slide-drawer 0.25s ease",
            }}>
              <SidebarContent pathname={pathname} role={role} onClose={() => setDrawerOpen(false)} />
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
                textDecoration: "none", flex: 1,
                minWidth: 0,
                background: active ? "rgba(195,21,42,0.08)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: active ? 700 : 500, color: active ? "#c3152a" : "#94a3b8", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* All modules button */}
        <button
          onClick={() => setDrawerOpen(true)}
          type="button"
          aria-label="عرض كل الوحدات"
          aria-expanded={drawerOpen}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "0.2rem", padding: "0.4rem 0.6rem", borderRadius: "10px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font)", flex: 1, minWidth: 0,
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>☰</span>
          <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "#94a3b8" }}>الكل</span>
        </button>
      </nav>

      <style>{`
        /* Mobile breakpoint */
        @media (max-width: 768px) {
          .desktop-sidebar   { display: none !important; }
          .hamburger-btn     { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .logo-text         { display: none; }
          .user-name-block   { display: none; }
          .drawer-header     { display: flex !important; }
          main               { padding: 1rem !important; padding-bottom: calc(5.5rem + env(safe-area-inset-bottom)) !important; }
        }
        @media (max-width: 420px) {
          header button[aria-label="التنبيهات"] { display: none !important; }
          header button:not(.hamburger-btn) { padding-inline: 0.6rem !important; }
        }
        @media (min-width: 769px) {
          .drawer-close-btn  { display: none; }
          .drawer-header     { display: none; }
        }
        @keyframes slide-drawer {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
