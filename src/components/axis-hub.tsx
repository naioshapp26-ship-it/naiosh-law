"use client";

import Link from "next/link";
import { useState } from "react";
import type { ImperialAxis, NavDropdown, NavItem } from "@/data/empire-structure";
import { resolveItemHref } from "@/lib/empire-routes";

type Props = {
  axis: ImperialAxis;
  userName: string;
};

function ItemCard({ item }: { item: NavItem }) {
  const href = resolveItemHref(item);
  return (
    <Link
      href={href}
      className="card-white"
      style={{
        display: "block",
        padding: "1rem 1.15rem",
        textDecoration: "none",
        borderRight: "3px solid rgba(195,21,42,0.35)",
      }}
    >
      <p style={{ fontWeight: 700, color: "#0a0a12", fontSize: "0.88rem", marginBottom: "0.25rem" }}>
        {item.label}
      </p>
      {item.moduleSlug && (
        <span style={{ fontSize: "0.7rem", color: "#c3152a", fontWeight: 600 }}>
          وحدة تشغيلية ←
        </span>
      )}
    </Link>
  );
}

function DropdownSection({ dropdown, defaultOpen }: { dropdown: NavDropdown; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="card-white" style={{ overflow: "hidden", marginBottom: "0.85rem" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.1rem 1.25rem",
          background: open ? "linear-gradient(135deg, rgba(195,21,42,0.06) 0%, #fff 100%)" : "#fff",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-cairo)",
          textAlign: "right",
        }}
      >
        <div>
          <p style={{ fontWeight: 800, color: "#0a0a12", fontSize: "0.95rem" }}>{dropdown.title}</p>
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
            {dropdown.items.length} عنصر
          </p>
        </div>
        <span style={{ color: "#c3152a", fontWeight: 700, fontSize: "0.85rem" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          style={{
            padding: "0 1rem 1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "0.65rem",
            borderTop: "1px solid #f1f5f9",
            paddingTop: "1rem",
          }}
        >
          {dropdown.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AxisHubPage({ axis, userName }: Props) {
  const itemCount = axis.items?.length ?? axis.dropdowns?.reduce((n, d) => n + d.items.length, 0) ?? 0;

  return (
    <div className="erp-page" style={{ width: "100%" }}>
      {/* Hero banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${axis.color} 0%, #0a0a12 100%)`,
          borderRadius: "20px",
          padding: "2rem 2.25rem",
          marginBottom: "1.75rem",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            left: -30,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: "16px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
              }}
            >
              {axis.icon}
            </span>
            <div>
              <p style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.15rem" }}>{axis.subtitle}</p>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 900 }}>{axis.title}</h1>
            </div>
          </div>
          <p style={{ fontSize: "0.9rem", opacity: 0.85, maxWidth: 560, lineHeight: 1.7 }}>
            مرحبًا {userName} — هذا المحور يحتوي على {itemCount} عنصرًا ضمن الهيكل السيادي الموحّد.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          { label: "إجمالي العناصر", value: itemCount, icon: "📋" },
          { label: "المحور", value: `#${axis.id}`, icon: axis.icon },
          ...(axis.dropdowns
            ? [{ label: "القوائم المنسدلة", value: axis.dropdowns.length, icon: "📂" }]
            : []),
        ].map((s) => (
          <div key={s.label} className="card-white" style={{ padding: "1rem 1.1rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{s.label}</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 900, color: axis.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {axis.dropdowns ? (
        <div>
          {axis.slug === "legal-classification" && (
            <Link
              href="/app/international-laws"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
                padding: "0.75rem 1.25rem",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #c3152a 0%, #a01020 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(195,21,42,0.3)",
              }}
            >
              📚 فتح منظومة التصنيف القانوني الكاملة (8 محاور) ←
            </Link>
          )}
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem", color: "#0a0a12" }}>
            القوائم المنسدلة — التصنيف القانوني
          </h2>
          {axis.dropdowns.map((d, i) => (
            <DropdownSection key={d.id} dropdown={d} defaultOpen={i === 0} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {axis.items?.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link
          href="/app/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "#c3152a",
            fontWeight: 700,
            fontSize: "0.875rem",
          }}
        >
          ← العودة للوحة التحكم الإمبراطورية
        </Link>
      </div>
    </div>
  );
}
