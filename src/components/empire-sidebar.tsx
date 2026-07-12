"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { imperialAxes } from "@/data/empire-structure";

type Props = {
  collapsed?: boolean;
};

const activeLink =
  "bg-white text-red-900 font-bold shadow-md [&_span]:text-red-900";
const inactiveLink =
  "text-white hover:bg-white/15 hover:text-white [&_span]:text-white";

export function EmpireSidebarNav({ collapsed = false }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (collapsed) return null;

  const axes = imperialAxes.filter((a) => a.id <= 9);

  return (
    <div className="flex flex-col flex-1 justify-evenly min-h-0 py-2">
      <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-red-200/80 shrink-0">
        المحاور القانونية
      </p>

      {axes.map((axis) => {
        const active = isActive(axis.href);
        return (
          <Link
            key={axis.slug}
            href={axis.href}
            title={axis.title}
            className={`flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-xl text-sm transition-all shrink-0 ${
              active ? activeLink : inactiveLink
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
