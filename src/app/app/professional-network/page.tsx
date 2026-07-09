"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/lib/session";

type Professional = {
  id: string;
  name: string;
  type: string;
  licenseNo: string;
  rating: string;
  status: string;
  specializations: string;
};

type NetworkItem = {
  id: string;
  type: string;
  status: string;
  from: string;
  to: string;
  caseRef: string;
  date: string;
};

export default function ProfessionalNetworkPage() {
  const { user, ready } = useSession(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [network, setNetwork] = useState<NetworkItem[]>([]);
  const [tab, setTab] = useState<"professionals" | "network">("professionals");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadNetworkData() {
      try {
        const [prosResponse, networkResponse] = await Promise.all([
          fetch("/api/professionals", { credentials: "include" }),
          fetch("/api/professional-network", { credentials: "include" }),
        ]);
        if (!prosResponse.ok || !networkResponse.ok) {
          throw new Error("Failed to load professional network data");
        }
        const [pros, net]: unknown[] = await Promise.all([prosResponse.json(), networkResponse.json()]);
        if (!Array.isArray(pros) || !Array.isArray(net)) {
          throw new Error("Invalid professional network payload");
        }
        if (!cancelled) {
          setProfessionals(pros as Professional[]);
          setNetwork(net as NetworkItem[]);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setProfessionals([]);
          setNetwork([]);
          setError("تعذر تحميل بيانات الشبكة المهنية حالياً.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNetworkData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !user) return null;

  return (
    <AppShell role={user.role} name={user.name}>
      <div style={{ maxWidth: 1100 }}>
        <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.35rem" }}>
          🤝 الشبكة المهنية
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          محامون ومستشارون وقضاة — طلبات تعاون وإحالة قضايا وتبادل آراء
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[
            { key: "professionals" as const, label: "المحترفون" },
            { key: "network" as const, label: "طلبات الشبكة" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "10px",
                border: tab === t.key ? "1px solid #c3152a" : "1px solid #e2e8f0",
                background: tab === t.key ? "rgba(195,21,42,0.08)" : "#fff",
                color: tab === t.key ? "#c3152a" : "#475569",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "#64748b" }}>جاري التحميل...</p>
        ) : error ? (
          <div className="card-white" style={{ padding: "1.5rem", color: "#c3152a", fontWeight: 700 }}>
            {error}
          </div>
        ) : tab === "professionals" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {professionals.length === 0 ? (
              <div className="card-white" style={{ padding: "1.5rem", color: "#64748b", gridColumn: "1 / -1" }}>
                لا توجد ملفات مهنية مسجلة حالياً.
              </div>
            ) : (
              professionals.map((p) => (
                <div key={p.id} className="card-white" style={{ padding: "1.25rem" }}>
                  <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{p.name}</h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
                    {p.type === "lawyer" ? "محامٍ" : p.type === "consultant" ? "مستشار" : "قاضٍ"} • {p.licenseNo}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "0.5rem" }}>{p.specializations || "—"}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#f59e0b", fontWeight: 700 }}>⭐ {p.rating}</span>
                    <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600 }}>{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="card-white" style={{ padding: "1rem" }}>
            {network.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>لا توجد طلبات شبكة حالياً</p>
            ) : (
              network.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.85rem 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>
                    <strong>{n.from}</strong> → <strong>{n.to}</strong> ({n.type})
                  </span>
                  <span style={{ color: "#64748b" }}>{n.status} • {n.date}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
