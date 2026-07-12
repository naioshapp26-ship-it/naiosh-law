"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { EmpireSidebarNav } from "@/components/empire-sidebar";
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
  admin: "bg-red-600",
  lawyer: "bg-blue-600",
  consultant: "bg-indigo-600",
  judge: "bg-purple-600",
  client: "bg-emerald-600",
  industrial_agent: "bg-amber-600",
  employee: "bg-slate-600",
};

const NAV = [
  { href: "/app/dashboard", label: "لوحة التحكم", icon: "🏛️" },
  { href: "/app/cases", label: "القضايا", icon: "⚖️" },
  { href: "/app/clients", label: "العملاء", icon: "👥" },
  { href: "/app/documents", label: "المستندات", icon: "📄" },
  { href: "/app/calendar", label: "التقويم", icon: "📅" },
  { href: "/app/billing", label: "الفواتير", icon: "💰" },
  { href: "/app/reports", label: "التقارير", icon: "📊" },
  { href: "/app/settings", label: "الإعدادات", icon: "⚙️" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const role = (user?.role ?? "client") as UserRole;
  const roleLabel = ROLE_LABELS[role] ?? "مستخدم";
  const roleColor = ROLE_COLORS[role] ?? "bg-gray-600";

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
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar — أحمر/أبيض */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-16"
        } bg-gradient-to-b from-red-800 to-red-900 text-white transition-all duration-300 flex flex-col shadow-xl shrink-0`}
      >
        <div className="p-4 border-b border-red-700/50">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">نايوش</h1>
                <p className="text-xs text-red-200">النظام القانوني السيادي</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-red-700/50 text-white"
              aria-label="تبديل القائمة"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-red-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                {user?.name?.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name ?? "مستخدم"}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleColor} text-white`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                  active
                    ? "bg-white text-red-800 font-semibold shadow-sm"
                    : "text-red-100 hover:bg-red-700/50 hover:text-white"
                }`}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}

          {sidebarOpen && (
            <div className="mt-4 px-2">
              <EmpireSidebarNav
                theme={{
                  text: "#ffffff",
                  muted: "rgba(254, 226, 226, 0.85)",
                  activeBg: "rgba(255, 255, 255, 0.18)",
                  accent: "#fecaca",
                }}
              />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-red-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-200 hover:bg-red-700/50 hover:text-white transition-colors"
          >
            <span>🚪</span>
            {sidebarOpen && <span className="text-sm">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
