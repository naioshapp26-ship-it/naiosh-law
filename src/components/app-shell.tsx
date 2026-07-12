"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { EmpireSidebarNav } from "@/components/empire-sidebar";
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
          sidebarOpen ? "w-[280px]" : "w-[68px]"
        } bg-gradient-to-b from-red-900 via-red-800 to-red-950 text-white transition-all duration-300 flex flex-col shadow-2xl shrink-0 z-20`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            {sidebarOpen ? (
              <div className="min-w-0">
                <h1 className="text-lg font-black text-white tracking-tight">نايوش</h1>
                <p className="text-[11px] text-red-200/90">النظام القانوني السيادي 360</p>
              </div>
            ) : (
              <span className="text-xl mx-auto">⚖️</span>
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
          <div className="px-4 py-3 border-b border-white/10">
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin">
          {sidebarOpen && (
            <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-red-300/80">
              القائمة الرئيسية
            </p>
          )}

          <div className="px-2 space-y-0.5">
            {PRIMARY_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    active
                      ? "bg-white text-red-800 font-bold shadow-md"
                      : "text-red-50 hover:bg-white/10"
                  }`}
                >
                  <span className="text-lg shrink-0 w-6 text-center">{item.icon}</span>
                  {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          <EmpireSidebarNav collapsed={!sidebarOpen} />
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
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
