"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { EmpireSidebarNav } from "@/components/empire-sidebar";
import { BrandLogo } from "@/components/brand-logo";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const role = (user?.role ?? "client") as UserRole;
  const roleLabel = ROLE_LABELS[role] ?? "مستخدم";
  const roleColor = ROLE_COLORS[role] ?? "bg-gray-500";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    logout();
    window.location.assign("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      <aside
        className={`${
          sidebarOpen ? "w-[290px]" : "w-[72px]"
        } sticky top-0 h-screen bg-gradient-to-b from-red-950 via-red-900 to-red-950 text-white transition-all duration-300 flex flex-col shadow-2xl shrink-0 z-20`}
      >
        {/* Logo */}
        <div className="shrink-0 p-3 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            {sidebarOpen ? (
              <BrandLogo size={52} href="/app/dashboard" variant="light" className="flex-1" />
            ) : (
              <Link href="/app/dashboard" className="mx-auto block" title="NAIOSH Law">
                <BrandLogo size={44} showText={false} variant="light" />
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-red-100 shrink-0"
              aria-label="تبديل القائمة"
            >
              {sidebarOpen ? "◂" : "▸"}
            </button>
          </div>
        </div>

        {/* User */}
        {sidebarOpen && (
          <div className="shrink-0 px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 ring-2 ring-white/20 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name ?? "مستخدم"}</p>
                <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation — موزّع على طول الصفحة */}
        <nav className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {sidebarOpen ? (
            <>
              <div className="flex flex-col flex-1 justify-evenly min-h-0 px-1 py-2">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-red-300/70 shrink-0">
                  القائمة الرئيسية
                </p>
                {PRIMARY_NAV.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-xl text-sm transition-all shrink-0 ${
                        active
                          ? "bg-white text-red-800 font-bold shadow-md"
                          : "text-red-50 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-base shrink-0 w-5 text-center">{item.icon}</span>
                      <span className="truncate leading-snug">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="h-px bg-white/15 mx-4 shrink-0" />

              <EmpireSidebarNav collapsed={false} />
            </>
          ) : (
            <div className="flex flex-col flex-1 justify-evenly items-center py-4">
              {PRIMARY_NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`p-2.5 rounded-xl text-lg transition-all ${
                      active ? "bg-white shadow-md" : "hover:bg-white/10"
                    }`}
                  >
                    {item.icon}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="shrink-0 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-100 hover:bg-white/10 transition-colors"
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
