"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/lib/session";

type Entity = {
  id: string;
  name: string;
  type: string;
  city: string;
  phone: string;
  officials: number;
  status: string;
};

type Official = {
  id: string;
  name: string;
  role: string;
  court: string | null;
  chamber: string | null;
  entity: { name: string } | null;
};

export default function OfficialEntitiesPage() {
  const { user, ready } = useSession(true);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadOfficialData() {
      try {
        const [entitiesResponse, officialsResponse] = await Promise.all([
          fetch("/api/official-entities", { credentials: "include" }),
          fetch("/api/court-officials", { credentials: "include" }),
        ]);
        if (!entitiesResponse.ok || !officialsResponse.ok) {
          throw new Error("Failed to load official entities data");
        }
        const [ents, offs]: unknown[] = await Promise.all([entitiesResponse.json(), officialsResponse.json()]);
        if (!Array.isArray(ents) || !Array.isArray(offs)) {
          throw new Error("Invalid official entities payload");
        }
        if (!cancelled) {
          setEntities(ents as Entity[]);
          setOfficials(offs as Official[]);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setEntities([]);
          setOfficials([]);
          setError("تعذر تحميل بيانات الجهات الرسمية حالياً.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOfficialData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !user) return null;

  return (
    <AppShell role={user.role} name={user.name}>
      <div style={{ maxWidth: 1100 }}>
        <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.35rem" }}>
          🏢 الجهات الرسمية والمحاكم
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          جهات حكومية ومحاكم ودوائر — قضاة وأمناء سر وخبراء
        </p>

        {loading ? (
          <p style={{ color: "#64748b" }}>جاري التحميل...</p>
        ) : error ? (
          <div className="card-white" style={{ padding: "1.5rem", color: "#c3152a", fontWeight: 700 }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {entities.length === 0 ? (
                <div className="card-white" style={{ padding: "1.5rem", color: "#64748b", gridColumn: "1 / -1" }}>
                  لا توجد جهات رسمية مسجلة حالياً.
                </div>
              ) : (
                entities.map((e) => (
                  <div key={e.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{e.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{e.type} • {e.city}</p>
                    <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>📞 {e.phone}</p>
                    <p style={{ fontSize: "0.78rem", color: "#c3152a", marginTop: "0.35rem", fontWeight: 600 }}>
                      {e.officials} مسؤول مسجل
                    </p>
                  </div>
                ))
              )}
            </div>

            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem" }}>المسؤولون القضائيون</h2>
            <div className="card-white" style={{ padding: "1rem" }}>
              {officials.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>لا يوجد مسؤولون قضائيون حالياً</p>
              ) : (
                officials.map((o) => (
                  <div
                    key={o.id}
                    className="official-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.75rem 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span>
                      <strong>{o.name}</strong> — {o.role}
                    </span>
                    <span style={{ color: "#64748b" }}>
                      {o.entity?.name ?? o.court} {o.chamber ? `• ${o.chamber}` : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <style>{`
        @media (max-width: 560px) {
          .official-row {
            flex-direction: column;
          }
        }
      `}</style>
    </AppShell>
  );
}
