"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { imperialAxes } from "@/data/empire-structure";

type Props = {
  collapsed?: boolean;
};

export function EmpireSidebarNav({ collapsed = false }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (collapsed) return null;

  const axes = imperialAxes.filter((a) => a.id <= 9);

  return (
    <div className="flex flex-col flex-1 justify-evenly min-h-0 py-2">
      <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-red-300/70 shrink-0">
        المحاور القانونية
      </p>

      {axes.map((axis) => {
        const active = isActive(axis.href);
        return (
          <Link
            key={axis.slug}
            href={axis.href}
            title={axis.title}
            className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-xl text-sm transition-all shrink-0 ${
              active
                ? "bg-white text-red-800 font-bold shadow-md"
                : "text-red-50/95 hover:bg-white/10"
            }`}
          >
            <span className="text-base shrink-0 w-5 text-center">{axis.icon}</span>
            <span className="truncate leading-snug">{axis.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
