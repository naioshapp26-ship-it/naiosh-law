"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { imperialAxes } from "@/data/empire-structure";
import { useSiteTheme } from "@/components/theme-provider";

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function EmpireSidebarNav({ collapsed = false, onNavigate }: Props) {
  const pathname = usePathname();
  const { theme } = useSiteTheme();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (collapsed) return null;

  const axes = imperialAxes.filter((a) => a.id <= 9);

  return (
    <div className="flex flex-col gap-0.5 px-1 py-2 shrink-0">
      <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/60 shrink-0 mb-1">
        المحاور القانونية
      </p>

      {axes.map((axis) => {
        const active = isActive(axis.href);
        return (
          <Link
            key={axis.slug}
            href={axis.href}
            title={axis.title}
            onClick={onNavigate}
            className="flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-xl text-sm transition-all shrink-0 hover:bg-white/15"
            style={
              active
                ? { background: "#fff", color: theme.primaryColor, fontWeight: 700, boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }
                : { color: "#fff" }
            }
          >
            <span className="text-base shrink-0 w-5 text-center">{axis.icon}</span>
            <span className="truncate leading-snug">{axis.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
