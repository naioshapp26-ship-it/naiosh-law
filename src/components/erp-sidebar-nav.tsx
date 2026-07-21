"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ERP_SIDEBAR_MODULES,
  erpModuleHref,
  type ErpNavModule,
} from "@/data/erp-sidebar-modules";
import { useSiteTheme } from "@/components/theme-provider";

type Props = {
  onNavigate?: () => void;
};

function moduleActive(pathname: string, mod: ErpNavModule) {
  const base = `/app/erp/${mod.id}`;
  if (pathname === base || pathname.startsWith(base + "/")) return true;
  return (mod.subItems ?? []).some((s) => pathname === erpModuleHref(s.id));
}

export function ErpSidebarNav({ onNavigate }: Props) {
  const pathname = usePathname();
  const { theme } = useSiteTheme();
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const mod of ERP_SIDEBAR_MODULES) {
      if (moduleActive(pathname, mod) && (mod.subItems?.length ?? 0) > 0) {
        next[mod.id] = true;
      }
    }
    if (Object.keys(next).length) {
      setOpenIds((prev) => ({ ...prev, ...next }));
    }
  }, [pathname]);

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeStyle = {
    background: "#fff",
    color: theme.primaryColor,
    fontWeight: 700,
    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
  } as const;

  return (
    <div className="flex flex-col gap-0.5 px-1 py-2 shrink-0">
      <p
        className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/85 shrink-0 mb-1"
        style={{ color: "rgba(255,255,255,0.9)" }}
      >
        وحدات المنظومة
      </p>

      {ERP_SIDEBAR_MODULES.map((mod) => {
        const hasSubs = (mod.subItems?.length ?? 0) > 0;
        const open = !!openIds[mod.id];
        const active = moduleActive(pathname, mod);
        const href = erpModuleHref(mod.id);

        if (!hasSubs) {
          return (
            <Link
              key={mod.id}
              href={href}
              title={mod.label}
              onClick={onNavigate}
              className="flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-xl text-sm transition-all shrink-0 hover:bg-white/15"
              style={active ? activeStyle : { color: "#fff" }}
            >
              <i className={`fas ${mod.icon} w-5 text-center shrink-0 text-[0.95rem]`} aria-hidden />
              <span className="truncate leading-snug">{mod.label}</span>
            </Link>
          );
        }

        return (
          <div key={mod.id} className="mx-2 shrink-0">
            <button
              type="button"
              onClick={() => toggle(mod.id)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all shrink-0 hover:bg-white/15 text-right"
              style={active && !open ? activeStyle : { color: "#fff", background: "transparent" }}
              aria-expanded={open}
            >
              <i className={`fas ${mod.icon} w-5 text-center shrink-0 text-[0.95rem]`} aria-hidden />
              <span className="truncate leading-snug flex-1 font-medium">{mod.label}</span>
              <i
                className={`fas fa-chevron-down text-[0.65rem] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {open && (
              <div className="mt-1 mr-4 mb-1 space-y-0.5 border-r border-white/45 pr-2">
                <Link
                  href={href}
                  onClick={onNavigate}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[0.78rem] transition-all hover:bg-white/15"
                  style={
                    pathname === href
                      ? activeStyle
                      : { color: "rgba(255,255,255,0.88)" }
                  }
                >
                  <i className="fas fa-th-large w-4 text-center shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">نظرة عامة</span>
                </Link>
                {mod.subItems!.map((sub) => {
                  const subHref = erpModuleHref(sub.id);
                  const subActive = pathname === subHref;
                  return (
                    <Link
                      key={sub.id}
                      href={subHref}
                      title={sub.label}
                      onClick={onNavigate}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[0.78rem] transition-all hover:bg-white/15"
                      style={subActive ? activeStyle : { color: "rgba(255,255,255,0.88)" }}
                    >
                      <i className={`fas ${sub.icon} w-4 text-center shrink-0 opacity-90`} aria-hidden />
                      <span className="truncate leading-snug">{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
