"use client";

export type KpiCard = {
  label: string;
  value: string | number;
  delta?: string;
  deltaPos?: boolean;
  icon: string;
  accent: string;
};

type Props = { cards: KpiCard[] };

export function StatsRow({ cards }: Props) {
  const cols = Math.min(cards.length, 4);
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
        className="kpi-row-grid"
      >
        {cards.map((c) => (
          <div key={c.label} className="card-white" style={{ padding: "1.2rem 1.35rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.7rem" }}>
              <span style={{ fontSize: "0.73rem", color: "#64748b", fontWeight: 600 }}>{c.label}</span>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "10px",
                  background: `${c.accent}18`,
                  border: `1px solid ${c.accent}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
              >
                {c.icon}
              </div>
            </div>
            <div style={{ fontSize: "1.95rem", fontWeight: 900, color: "#0a0a12", lineHeight: 1 }}>{c.value}</div>
            {c.delta && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: c.deltaPos !== false ? "#16a34a" : "#dc2626",
                  marginTop: "0.35rem",
                  fontWeight: 600,
                }}
              >
                {c.deltaPos !== false ? "↑" : "↓"} {c.delta}
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { .kpi-row-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 500px) { .kpi-row-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
