"use client";

import { ReactNode, useState } from "react";

/* ── Page header with gradient accent ── */
type HeaderProps = {
  icon: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export function PageHeader({ icon, title, subtitle, actions }: HeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
        marginBottom: "1.75rem",
        paddingBottom: "1.25rem",
        borderBottom: "2px solid #f1f5f9",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.35rem" }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #c3152a 0%, #8f0c1e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.35rem",
              boxShadow: "0 4px 14px rgba(195,21,42,0.25)",
            }}
          >
            {icon}
          </span>
          <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", margin: 0 }}>{title}</h1>
        </div>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0, paddingInlineStart: "3.25rem" }}>{subtitle}</p>
      </div>
      {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

/* ── KPI stats row ── */
type Stat = { label: string; value: string | number; icon?: string; color?: string };

export function PageStats({ stats }: { stats: Stat[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "0.85rem",
        marginBottom: "1.5rem",
      }}
    >
      {stats.map((s) => (
        <div key={s.label} className="card-white" style={{ padding: "1rem 1.15rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.35rem" }}>{s.label}</p>
            {s.icon && <span style={{ fontSize: "1.1rem" }}>{s.icon}</span>}
          </div>
          <p style={{ fontSize: "1.45rem", fontWeight: 900, color: s.color ?? "#0a0a12" }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Tab bar ── */
type Tab = { key: string; label: string; count?: number };

export function PageTabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (k: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          style={{
            padding: "0.55rem 1.15rem",
            borderRadius: "12px",
            border: active === t.key ? "2px solid #c3152a" : "1px solid #e2e8f0",
            background: active === t.key ? "linear-gradient(135deg, rgba(195,21,42,0.1) 0%, rgba(195,21,42,0.04) 100%)" : "#fff",
            color: active === t.key ? "#c3152a" : "#475569",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-cairo)",
            fontSize: "0.875rem",
            transition: "all 0.2s",
          }}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              style={{
                marginInlineStart: "0.4rem",
                background: active === t.key ? "#c3152a" : "#e2e8f0",
                color: active === t.key ? "#fff" : "#64748b",
                borderRadius: "20px",
                padding: "0.1rem 0.45rem",
                fontSize: "0.7rem",
              }}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Primary / secondary action buttons ── */
export function BtnPrimary({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "0.6rem 1.25rem",
        borderRadius: "12px",
        border: "none",
        background: disabled ? "#e2e8f0" : "linear-gradient(135deg, #c3152a 0%, #a01020 100%)",
        color: disabled ? "#94a3b8" : "#fff",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-cairo)",
        fontSize: "0.875rem",
        boxShadow: disabled ? "none" : "0 4px 12px rgba(195,21,42,0.3)",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "0.6rem 1.15rem",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        color: "#475569",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-cairo)",
        fontSize: "0.875rem",
      }}
    >
      {children}
    </button>
  );
}

/* ── Empty state with seed + add CTAs ── */
type EmptyProps = {
  icon: string;
  title: string;
  description: string;
  onSeed?: () => void;
  onAdd?: () => void;
  seeding?: boolean;
  canWrite?: boolean;
};

export function EmptyState({ icon, title, description, onSeed, onAdd, seeding, canWrite }: EmptyProps) {
  return (
    <div
      className="card-white"
      style={{
        padding: "3.5rem 2rem",
        textAlign: "center",
        background: "linear-gradient(180deg, #fff 0%, #fafbfc 100%)",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "20px",
          background: "rgba(195,21,42,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          margin: "0 auto 1.25rem",
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.5rem", fontSize: "1.15rem" }}>{title}</h3>
      <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: 420, margin: "0 auto 1.75rem", lineHeight: 1.7 }}>{description}</p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        {onSeed && (
          <BtnPrimary onClick={onSeed} disabled={seeding}>
            {seeding ? "⏳ جاري التحميل..." : "📦 تحميل البيانات التجريبية"}
          </BtnPrimary>
        )}
        {canWrite && onAdd && <BtnSecondary onClick={onAdd}>➕ إضافة جديد</BtnSecondary>}
      </div>
    </div>
  );
}

/* ── Loading spinner ── */
export function PageLoader({ label = "جاري التحميل..." }: { label?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid #e2e8f0",
          borderTopColor: "#c3152a",
          animation: "spin-slow 0.9s linear infinite",
          margin: "0 auto 1rem",
        }}
      />
      <p>{label}</p>
    </div>
  );
}

/* ── Toast notification ── */
export function useToast() {
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const show = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const Toast = toast ? (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        padding: "0.85rem 1.5rem",
        borderRadius: "14px",
        background: toast.type === "success" ? "#0f172a" : "#c3152a",
        color: "#fff",
        fontWeight: 600,
        fontSize: "0.875rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      {toast.text}
    </div>
  ) : null;

  return { show, Toast };
}

/* ── Hook: seed demo data ── */
export function useSeedDemo(onDone?: () => void) {
  const [seeding, setSeeding] = useState(false);
  const { show, Toast } = useToast();

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed-demo", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      show("success", data.message ?? "تم تحميل البيانات");
      onDone?.();
    } catch {
      show("error", "فشل تحميل البيانات التجريبية");
    } finally {
      setSeeding(false);
    }
  };

  return { seed, seeding, Toast };
}
