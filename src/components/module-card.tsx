import Link from "next/link";
import { getModuleHref, moduleIcons, type LegalModule } from "@/data/modules";

type Props = {
  item: LegalModule;
};

export function ModuleCard({ item }: Props) {
  const icon = moduleIcons[item.slug] ?? "📌";

  return (
    <Link
      href={getModuleHref(item.slug)}
      className="card-white"
      style={{
        display: "block",
        padding: "1.5rem",
        textDecoration: "none",
        transition: "all 0.22s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {/* Icon */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "13px",
            background: "rgba(195,21,42,0.07)",
            border: "1px solid rgba(195,21,42,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.35rem",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "#0a0a12",
              marginBottom: "0.3rem",
              lineHeight: 1.35,
            }}
          >
            {item.title}
          </h3>
          <p
            style={{
              fontSize: "0.78rem",
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: "0.85rem",
            }}
          >
            {item.subtitle}
          </p>

          {/* Meta row */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                background: "rgba(195,21,42,0.07)",
                color: "#c3152a",
                borderRadius: "6px",
                padding: "0.2rem 0.6rem",
                fontSize: "0.68rem",
                fontWeight: 700,
              }}
            >
              {item.screens.length} شاشة
            </span>
            <span
              style={{
                background: "#f1f5f9",
                color: "#475569",
                borderRadius: "6px",
                padding: "0.2rem 0.6rem",
                fontSize: "0.68rem",
                fontWeight: 600,
              }}
            >
              {item.functions.length} وظيفة
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            color: "#c3152a",
            fontSize: "1rem",
            flexShrink: 0,
            marginTop: "0.25rem",
          }}
        >
          ←
        </div>
      </div>
    </Link>
  );
}
