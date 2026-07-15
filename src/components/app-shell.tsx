"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { EmpireSidebarNav } from "@/components/empire-sidebar";
import { BrandLogo } from "@/components/brand-logo";
import { useSiteTheme } from "@/components/theme-provider";
import { PRIMARY_NAV } from "@/lib/empire-routes";
import type { UserRole } from "@/lib/session";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "مدير النظام",
  lawyer: "محامٍ",
  consultant: "مستشار",
  judge: "قاضٍ",
  client: "عميل",
  industrial_agent: "وكيل صناعي",
  employee: "موظف",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-500",
  lawyer: "bg-blue-500",
  consultant: "bg-indigo-500",
  judge: "bg-purple-500",
  client: "bg-emerald-500",
  industrial_agent: "bg-amber-500",
  employee: "bg-slate-500",
};

const ADMIN_NAV = {
  href: "/app/system-settings",
  label: "إعدادات النظام",
  icon: "🎨",
} as const;

const MOBILE_BOTTOM_NAV = [
  { href: "/app/dashboard", icon: "⊞", label: "الرئيسية" },
  { href: "/app/modules/case-management", icon: "⚖️", label: "القضايا" },
  { href: "/app/modules/court-sessions", icon: "🏛️", label: "الجلسات" },
  { href: "/app/legal-finance", icon: "💰", label: "المالية" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const { theme } = useSiteTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const role = (user?.role ?? "client") as UserRole;
  const roleLabel = ROLE_LABELS[role] ?? "مستخدم";
  const roleColor = ROLE_COLORS[role] ?? "bg-gray-500";
  const isAdmin = role === "admin";

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    logout();
    window.location.assign("/login");
  }

  const sidebarStyle = {
    background: `linear-gradient(to bottom, ${theme.sidebarFrom}, ${theme.sidebarVia}, ${theme.sidebarTo})`,
  };

  const activeStyle = {
    background: "#fff",
    color: theme.primaryColor,
    fontWeight: 700,
    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
  };

  const inactiveStyle = {
    color: "#fff",
  };

  const navLinkStyle = (active: boolean): React.CSSProperties =>
    active ? activeStyle : { ...inactiveStyle, background: "transparent" };

  const SidebarNavBody = ({ onNavigate, showEmpire }: { onNavigate?: () => void; showEmpire: boolean }) => (
    <>
      <div className="flex flex-col flex-1 justify-evenly min-h-0 px-1 py-2">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/60 shrink-0">
          القائمة الرئيسية
        </p>
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={onNavigate}
              className="flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-xl text-sm transition-all shrink-0 hover:bg-white/15"
              style={navLinkStyle(active)}
            >
              <span className="text-base shrink-0 w-5 text-center">{item.icon}</span>
              <span className="truncate leading-snug">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="h-px bg-white/15 mx-4 my-1 shrink-0" />
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/60 shrink-0">
              تحكم المدير
            </p>
            <Link
              href={ADMIN_NAV.href}
              title={ADMIN_NAV.label}
              onClick={onNavigate}
              className="flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-xl text-sm transition-all shrink-0 hover:bg-white/15"
              style={{
                ...navLinkStyle(isActive(ADMIN_NAV.href)),
                ...(isActive(ADMIN_NAV.href)
                  ? {}
                  : {
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.08)",
                    }),
              }}
            >
              <span className="text-base shrink-0 w-5 text-center">{ADMIN_NAV.icon}</span>
              <span className="truncate leading-snug font-bold">{ADMIN_NAV.label}</span>
            </Link>
          </>
        )}
      </div>

      {showEmpire && (
        <>
          <div className="h-px bg-white/15 mx-4 shrink-0" />
          <EmpireSidebarNav collapsed={false} onNavigate={onNavigate} />
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "var(--site-bg, #f8fafc)" }} dir="rtl">
      {/* Mobile top header — restored previous phone layout */}
      <header className="mobile-top-header" style={{ display: "none" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            gap: "0.75rem",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="القائمة"
              style={{
                width: 38,
                height: 38,
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                background: "#f8f9fb",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                color: "#475569",
                flexShrink: 0,
              }}
            >
              ☰
            </button>
            <BrandLogo size={36} href="/app/dashboard" showText subtitle="لوحة التحكم" variant="dark" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link
              href="/app/communications"
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "#f8f9fb",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                textDecoration: "none",
                position: "relative",
              }}
              aria-label="التنبيهات"
            >
              🔔
            </Link>
            {isAdmin && (
              <Link
                href="/app/system-settings"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "#f8f9fb",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  textDecoration: "none",
                }}
                aria-label="الإعدادات"
              >
                ⚙️
              </Link>
            )}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(195,21,42,0.1)",
                color: theme.primaryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
              title={user?.name ?? "مستخدم"}
            >
              {user?.name?.charAt(0) ?? "N"}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: "rgba(195,21,42,0.07)",
                border: "1px solid rgba(195,21,42,0.15)",
                borderRadius: "9px",
                padding: "0.4rem 0.75rem",
                color: "#c3152a",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
                whiteSpace: "nowrap",
              }}
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Desktop sidebar — unchanged look; hidden on phones */}
      <aside
        className={`desktop-sidebar ${sidebarOpen ? "w-[290px]" : "w-[72px]"} sticky top-0 h-screen transition-all duration-300 flex-col shadow-2xl shrink-0 z-20`}
        style={{ ...sidebarStyle, display: "flex" }}
      >
        <div className="shrink-0 py-3 px-3 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            {sidebarOpen ? (
              <BrandLogo
                size={58}
                href="/app/dashboard"
                showText
                variant="light"
                subtitle={theme.tagline}
                className="flex-1 min-w-0"
              />
            ) : (
              <Link href="/app/dashboard" className="mx-auto block" title={theme.brandName}>
                <BrandLogo size={44} showText={false} />
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white shrink-0"
              aria-label="تبديل القائمة"
            >
              {sidebarOpen ? "◂" : "▸"}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="shrink-0 px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 ring-2 ring-white/20 flex items-center justify-center text-sm font-bold text-white">
                {user?.name?.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{user?.name ?? "مستخدم"}</p>
                <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full ${roleColor} text-white`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {sidebarOpen ? (
            <SidebarNavBody showEmpire />
          ) : (
            <div className="flex flex-col flex-1 justify-evenly items-center py-4">
              {PRIMARY_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className="p-2.5 rounded-xl text-lg transition-all"
                    style={active ? { background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" } : { opacity: 0.9 }}
                  >
                    {item.icon}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href={ADMIN_NAV.href}
                  title={ADMIN_NAV.label}
                  className="p-2.5 rounded-xl text-lg transition-all"
                  style={isActive(ADMIN_NAV.href) ? { background: "#fff" } : {}}
                >
                  {ADMIN_NAV.icon}
                </Link>
              )}
            </div>
          )}
        </nav>

        <div className="shrink-0 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/15 transition-colors"
          >
            <span className="w-6 text-center">🚪</span>
            {sidebarOpen && <span className="text-sm">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer overlay — previous phone menu behavior */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(10,10,18,0.5)", backdropFilter: "blur(2px)" }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: 290,
              maxWidth: "86vw",
              height: "100%",
              overflowY: "auto",
              boxShadow: "4px 0 30px rgba(0,0,0,0.2)",
              animation: "slide-drawer 0.25s ease",
              display: "flex",
              flexDirection: "column",
              ...sidebarStyle,
            }}
          >
            <div className="shrink-0 py-3 px-3 border-b border-white/10 flex items-center justify-between gap-2">
              <BrandLogo size={48} href="/app/dashboard" showText variant="light" subtitle={theme.tagline} className="flex-1 min-w-0" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق القائمة"
                style={{
                  width: 32,
                  height: 32,
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div className="shrink-0 px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/15 ring-2 ring-white/20 flex items-center justify-center text-sm font-bold text-white">
                  {user?.name?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-white">{user?.name ?? "مستخدم"}</p>
                  <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full ${roleColor} text-white`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
            <nav className="flex-1 flex flex-col min-h-0 overflow-auto">
              <SidebarNavBody onNavigate={() => setDrawerOpen(false)} showEmpire />
            </nav>
            <div className="shrink-0 p-3 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/15 transition-colors"
              >
                <span className="w-6 text-center">🚪</span>
                <span className="text-sm">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto min-w-0 app-main">
        <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav — restored previous phone navigation */}
      <nav
        className="mobile-bottom-nav"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          insetInline: 0,
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          padding: "0.5rem 0.75rem",
          zIndex: 100,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          justifyContent: "space-around",
        }}
      >
        {MOBILE_BOTTOM_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.4rem 0.6rem",
                borderRadius: "10px",
                textDecoration: "none",
                flex: 1,
                background: active ? "rgba(195,21,42,0.08)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#c3152a" : "#94a3b8",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.2rem",
            padding: "0.4rem 0.6rem",
            borderRadius: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-cairo)",
            flex: 1,
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>☰</span>
          <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "#94a3b8" }}>الكل</span>
        </button>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-top-header { display: block !important; }
          .mobile-bottom-nav { display: flex !important; }
          .app-main { padding-bottom: 5rem !important; }
        }
        @media (min-width: 769px) {
          .mobile-top-header { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }
        @keyframes slide-drawer {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
