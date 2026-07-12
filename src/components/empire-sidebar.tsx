"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { imperialAxes } from "@/data/empire-structure";
import { resolveItemHref, getAxisForPath } from "@/lib/empire-routes";

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function EmpireSidebarNav({ collapsed = false, onNavigate }: Props) {
  const pathname = usePathname();
  const activeAxis = getAxisForPath(pathname);
  const [openAxes, setOpenAxes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeAxis) {
      setOpenAxes((prev) => ({ ...prev, [activeAxis.slug]: true }));
    }
  }, [activeAxis?.slug]);

  const toggle = (slug: string) => {
    setOpenAxes((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (collapsed) return null;

  return (
    <div className="space-y-1">
      <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-red-300/80">
        المحاور القانونية
      </p>

      {imperialAxes
        .filter((a) => a.id <= 9)
        .map((axis) => {
          const open = openAxes[axis.slug] ?? false;
          const axisActive = isActive(axis.href);
          const previewItems = [
            ...(axis.items ?? []),
            ...(axis.dropdowns?.[0]?.items.slice(0, 3) ?? []),
          ].slice(0, 4);

          return (
            <div key={axis.slug} className="px-1">
              <div
                className={`flex items-center rounded-lg transition-colors ${
                  axisActive ? "bg-white/15" : "hover:bg-red-700/40"
                }`}
              >
                <Link
                  href={axis.href}
                  onClick={onNavigate}
                  className={`flex flex-1 items-center gap-2 px-3 py-2 text-sm min-w-0 ${
                    axisActive ? "text-white font-bold" : "text-red-50"
                  }`}
                >
                  <span className="text-base shrink-0">{axis.icon}</span>
                  <span className="truncate">{axis.title}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(axis.slug)}
                  className="px-2 py-2 text-[10px] text-red-200 hover:text-white shrink-0"
                  aria-label={open ? "طي" : "توسيع"}
                >
                  {open ? "▲" : "▼"}
                </button>
              </div>

              {open && previewItems.length > 0 && (
                <div className="mr-3 mt-0.5 mb-1 border-r-2 border-red-600/50 pr-2 space-y-0.5">
                  {previewItems.map((item) => {
                    const href = resolveItemHref(item);
                    const active = isActive(href);
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        onClick={onNavigate}
                        className={`block rounded-md px-2 py-1.5 text-xs truncate transition-colors ${
                          active
                            ? "bg-white text-red-800 font-semibold"
                            : "text-red-100/90 hover:bg-red-700/30 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  {axis.dropdowns && (
                    <p className="px-2 py-1 text-[10px] text-red-200/70">
                      + {axis.dropdowns.length} قوائم منسدلة
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
