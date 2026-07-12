"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { imperialAxes } from "@/data/empire-structure";

type Theme = {
  text: string;
  muted: string;
  activeBg: string;
  accent: string;
};

type Props = {
  onNavigate?: () => void;
  theme?: Theme;
};

const defaultTheme: Theme = {
  text: "#ffffff",
  muted: "rgba(255,255,255,0.82)",
  activeBg: "rgba(255,255,255,0.2)",
  accent: "#ffffff",
};

export function EmpireSidebarNav({ onNavigate, theme = defaultTheme }: Props) {
  const pathname = usePathname();
  const [openAxes, setOpenAxes] = useState<Record<string, boolean>>({ sovereign: true });

  const toggle = (slug: string) => {
    setOpenAxes((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <Link
        href="/app/dashboard"
        onClick={onNavigate}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "10px",
          fontSize: "0.85rem",
          fontWeight: isActive("/app/dashboard") ? 700 : 500,
          color: theme.text,
          background: isActive("/app/dashboard") ? theme.activeBg : "transparent",
          textDecoration: "none",
        }}
      >
        <span>👑</span>
        <span>اللوحة الإمبراطورية 360</span>
      </Link>

      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          color: theme.muted,
          letterSpacing: "0.06em",
          padding: "0.75rem 0.75rem 0.3rem",
        }}
      >
        المحاور القانونية الثمانية
      </p>

      {imperialAxes
        .filter((a) => a.id <= 8)
        .map((axis) => {
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
                  background: axisActive ? theme.activeBg : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-cairo)",
                  textAlign: "right",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{axis.icon}</span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: axisActive ? 700 : 600,
                      color: theme.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {axis.title}
                  </span>
                </div>
                <span style={{ fontSize: "0.6rem", color: theme.muted, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
              </button>

              {open && (
                <div style={{ paddingInlineStart: "0.35rem", marginBottom: "0.2rem" }}>
                  <Link
                    href={axis.href}
                    onClick={onNavigate}
                    style={{
                      display: "block",
                      padding: "0.38rem 0.75rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: theme.accent,
                      textDecoration: "none",
                    }}
                  >
                    عرض المحور الكامل ←
                  </Link>
                  {axis.items?.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href ?? "#"}
                      onClick={onNavigate}
                      style={{
                        display: "block",
                        padding: "0.32rem 0.75rem",
                        fontSize: "0.7rem",
                        color: pathname === item.href ? theme.accent : theme.muted,
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
                    <p style={{ padding: "0.3rem 0.75rem", fontSize: "0.68rem", color: theme.muted }}>
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
