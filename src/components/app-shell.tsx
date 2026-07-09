"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { getModuleIcon } from "@/lib/module-icons";
import { getVisibleOperationalModules } from "@/lib/module-routing";
import { useScrollLock } from "@/lib/use-scroll-lock";

type Props = {
  role: "admin" | "client";
  name: string;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AppShell({ role, name, onLogout, children }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const visibleModules = getVisibleOperationalModules(role);
  const preferredBottomSlugs = ["case-management", "court-sessions", "legal-accounting"];
  const bottomNavModules = preferredBottomSlugs
    .map((slug) => visibleModules.find((item) => item.slug === slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);
  const sidebarBg = "linear-gradient(180deg, #b10f24 0%, #8f0c1e 100%)";
  const sidebarBorder = "rgba(255,255,255,0.14)";
  const sidebarText = "#ffffff";
  const sidebarMutedText = "rgba(255,255,255,0.82)";
  const sidebarSoftText = "rgba(255,255,255,0.64)";
  const sidebarActiveBg = "rgba(255,255,255,0.2)";

  const logout = () => {
    onLogout();
  };

  const isActive = (href: string) => pathname === href;

  useScrollLock(drawerOpen, () => setDrawerOpen(false));

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo inside drawer (mobile) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 0.75rem",
          borderBottom: `1px solid ${sidebarBorder}`,
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
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: sidebarText }}>Naiosh Law</span>
        </div>
        <button
          onClick={() => setDrawerOpen(false)}
          className="drawer-close-btn"
          style={{
            width: 32, height: 32, border: `1px solid ${sidebarBorder}`,
            borderRadius: "8px", background: "rgba(255,255,255,0.12)", cursor: "pointer",
            fontSize: "0.9rem", color: sidebarText,
          }}
        >✕</button>
      </div>

      {/* Dashboard link */}
      <div style={{ padding: "0 0.75rem", marginBottom: "0.25rem" }}>
        <Link
          href="/app/dashboard"
          onClick={() => setDrawerOpen(false)}
          style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.6rem 0.75rem", borderRadius: "10px",
            fontSize: "0.85rem", fontWeight: isActive("/app/dashboard") ? 700 : 500,
            color: sidebarText,
            background: isActive("/app/dashboard") ? sidebarActiveBg : "transparent",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "1rem" }}>⊞</span>
          <span>لوحة التحكم</span>
        </Link>
      </div>

      {/* Section label */}
      <p style={{
        fontSize: "0.62rem", fontWeight: 700, color: sidebarSoftText,
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
          const href   = `/app/modules/${item.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={item.slug}
              href={href}
              onClick={() => setDrawerOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.6rem 0.75rem", borderRadius: "10px",
                fontSize: "0.84rem", fontWeight: active ? 700 : 500,
                color: sidebarText,
                background: active ? sidebarActiveBg : "transparent",
                textDecoration: "none", transition: "all 0.15s",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{getModuleIcon(item.slug)}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      <div style={{ padding: "0.75rem" }}>
        <div style={{
          background: "rgba(0,0,0,0.14)", border: `1px solid ${sidebarBorder}`,
          borderRadius: "12px", padding: "0.85rem",
        }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: sidebarText, marginBottom: "0.2rem" }}>
            {role === "admin" ? "Admin" : "Client"}
          </p>
          <p style={{ fontSize: "0.67rem", color: sidebarMutedText, lineHeight: 1.5 }}>
            {role === "admin" ? "صلاحية كاملة على النظام" : "عرض الحالة والمستندات"}
          </p>
        </div>
      </div>
    </div>
  );

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="hamburger-btn"
              style={{
                width: 38, height: 38, border: "1px solid #e2e8f0",
                borderRadius: "10px", background: "#f8f9fb",
                cursor: "pointer", display: "none",
                alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", color: "#475569", flexShrink: 0,
              }}
              aria-label="القائمة"
              aria-controls="app-mobile-drawer"
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Notification bell */}
            <button style={{
              width: 36, height: 36, borderRadius: "10px",
              background: "#f8f9fb", border: "1px solid #e2e8f0",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "0.9rem", position: "relative",
              flexShrink: 0,
            }} aria-label="التنبيهات">
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
                <div style={{ color: "#94a3b8", fontSize: "0.58rem" }}>{role === "admin" ? "Admin" : "Client"}</div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              style={{
                background: "rgba(195,21,42,0.07)", border: "1px solid rgba(195,21,42,0.15)",
                borderRadius: "9px", padding: "0.4rem 0.75rem",
                color: "#c3152a", fontSize: "0.75rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--font-cairo)",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#c3152a"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.07)"; (e.currentTarget as HTMLElement).style.color = "#c3152a"; }}
            >
              <span className="logout-text">خروج</span>
              <span className="logout-icon" aria-hidden="true">⎋</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── Desktop Sidebar ── */}
        <aside className="desktop-sidebar" style={{
          width: 255, background: sidebarBg,
          borderInlineEnd: `1px solid ${sidebarBorder}`,
          overflowY: "auto", flexShrink: 0,
        }}>
          <div style={{ padding: "1rem 0" }}>
            {/* Dashboard */}
            <div style={{ padding: "0 0.75rem", marginBottom: "0.25rem" }}>
              <Link
                href="/app/dashboard"
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.6rem 0.75rem", borderRadius: "10px",
                  fontSize: "0.85rem", fontWeight: isActive("/app/dashboard") ? 700 : 500,
                  color: sidebarText,
                  background: isActive("/app/dashboard") ? sidebarActiveBg : "transparent",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: "1rem" }}>⊞</span>
                <span>لوحة التحكم</span>
              </Link>
            </div>

            <p style={{
              fontSize: "0.62rem", fontWeight: 700, color: sidebarSoftText,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "0.75rem 1.5rem 0.35rem",
            }}>الوحدات التشغيلية</p>

            <nav style={{ padding: "0 0.75rem", display: "flex", flexDirection: "column", gap: "2px" }}>
              {visibleModules.map((item) => {
                const href   = `/app/modules/${item.slug}`;
                const active = pathname === href;
                return (
                  <Link
                    key={item.slug}
                    href={href}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.6rem",
                      padding: "0.6rem 0.75rem", borderRadius: "10px",
                      fontSize: "0.84rem", fontWeight: active ? 700 : 500,
                      color: sidebarText,
                      background: active ? sidebarActiveBg : "transparent",
                      textDecoration: "none", transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{getModuleIcon(item.slug)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            <div style={{ padding: "1rem 0.75rem 0" }}>
              <div style={{
                background: "rgba(0,0,0,0.14)", border: `1px solid ${sidebarBorder}`,
                borderRadius: "12px", padding: "0.9rem",
              }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: sidebarText, marginBottom: "0.2rem" }}>
                  {role === "admin" ? "Admin" : "Client"}
                </p>
                <p style={{ fontSize: "0.67rem", color: sidebarMutedText, lineHeight: 1.5 }}>
                  {role === "admin" ? "صلاحية كاملة على النظام" : "عرض الحالة والمستندات"}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Mobile Drawer Overlay ── */}
        {drawerOpen && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              display: "flex",
            }}
          >
            {/* Backdrop */}
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(10,10,18,0.5)", backdropFilter: "blur(2px)" }}
            />
            {/* Drawer panel */}
            <div style={{
              animation: "slide-drawer 0.25s ease",
              position: "relative", zIndex: 1,
              width: 280, background: sidebarBg,
              height: "100%", overflowY: "auto",
              boxShadow: "-4px 0 30px rgba(0,0,0,0.15)",
            }}
              id="app-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="قائمة وحدات النظام"
              tabIndex={-1}
            >
              {sidebarContent}
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
        {[
          { href: "/app/dashboard", icon: "⊞", label: "الرئيسية" },
          ...bottomNavModules.map((item) => ({
            href: `/app/modules/${item.slug}`,
            icon: getModuleIcon(item.slug),
            label: item.title.replace(/^إدارة\s+/, "").split(" ")[0] || item.title,
          })),
        ].map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "0.2rem", padding: "0.4rem 0.6rem", borderRadius: "10px",
                textDecoration: "none", flex: 1,
                background: active ? "rgba(195,21,42,0.08)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: active ? 700 : 500, color: active ? "#c3152a" : "#94a3b8" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* All modules button */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-controls="app-mobile-drawer"
          aria-expanded={drawerOpen}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "0.2rem", padding: "0.4rem 0.6rem", borderRadius: "10px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-cairo)", flex: 1,
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
          .logout-text       { display: inline; }
          .logout-icon       { display: none; }
          .drawer-header     { display: flex !important; }
          main               { padding-bottom: calc(5.5rem + env(safe-area-inset-bottom)) !important; }
        }
        @media (max-width: 420px) {
          .logout-text       { display: none; }
          .logout-icon       { display: inline; }
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
