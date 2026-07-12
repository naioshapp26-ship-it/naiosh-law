"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { imperialAxes } from "@/data/empire-structure";

type Props = {
  onNavigate?: () => void;
};

export function EmpireSidebarNav({ onNavigate }: Props) {
  const pathname = usePathname();
  const [openAxes, setOpenAxes] = useState<Record<string, boolean>>({ sovereign: true });

  const toggle = (slug: string) => {
    setOpenAxes((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {/* Imperial dashboard */}
      <Link
        href="/app/dashboard"
        onClick={onNavigate}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.65rem 0.75rem",
          borderRadius: "10px",
          fontSize: "0.85rem",
          fontWeight: isActive("/app/dashboard") ? 700 : 500,
          color: isActive("/app/dashboard") ? "#c3152a" : "#64748b",
          background: isActive("/app/dashboard") ? "rgba(195,21,42,0.08)" : "transparent",
          textDecoration: "none",
        }}
      >
        <span>👑</span>
        <span>اللوحة الإمبراطورية</span>
      </Link>

      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "#94a3b8",
          letterSpacing: "0.06em",
          padding: "0.85rem 0.75rem 0.3rem",
        }}
      >
        المحاور القانونية الثمانية
      </p>

      {imperialAxes.map((axis) => {
        const open = openAxes[axis.slug] ?? false;
        const axisActive = isActive(axis.href);
        return (
          <div key={axis.slug}>
            <button
              type="button"
              onClick={() => toggle(axis.slug)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                padding: "0.55rem 0.75rem",
                borderRadius: "10px",
                border: "none",
                background: axisActive ? "rgba(195,21,42,0.06)" : "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
                textAlign: "right",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{axis.icon}</span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: axisActive ? 700 : 600,
                    color: axisActive ? "#c3152a" : "#475569",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {axis.title}
                </span>
              </div>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8", flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
              <div style={{ paddingInlineStart: "0.5rem", marginBottom: "0.25rem" }}>
                <Link
                  href={axis.href}
                  onClick={onNavigate}
                  style={{
                    display: "block",
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#c3152a",
                    textDecoration: "none",
                  }}
                >
                  عرض المحور الكامل ←
                </Link>
                {axis.items?.slice(0, 6).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href ?? "#"}
                    onClick={onNavigate}
                    style={{
                      display: "block",
                      padding: "0.38rem 0.75rem",
                      fontSize: "0.74rem",
                      color: pathname === item.href ? "#c3152a" : "#64748b",
                      fontWeight: pathname === item.href ? 700 : 500,
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    • {item.label}
                  </Link>
                ))}
                {axis.dropdowns && (
                  <p style={{ padding: "0.35rem 0.75rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                    {axis.dropdowns.length} قوائم منسدلة
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
