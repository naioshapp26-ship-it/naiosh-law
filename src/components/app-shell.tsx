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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const { theme } = useSiteTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    active
      ? activeStyle
      : { ...inactiveStyle, background: "transparent" };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--site-bg, #f8fafc)" }} dir="rtl">
      <aside
        className={`${
          sidebarOpen ? "w-[290px]" : "w-[72px]"
        } sticky top-0 h-screen transition-all duration-300 flex flex-col shadow-2xl shrink-0 z-20`}
        style={sidebarStyle}
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

              <div className="h-px bg-white/15 mx-4 shrink-0" />

              <EmpireSidebarNav collapsed={false} />
            </>
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

      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
