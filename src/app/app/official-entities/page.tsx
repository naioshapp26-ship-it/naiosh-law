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

  useEffect(() => {
    Promise.all([
      fetch("/api/official-entities", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/court-officials", { credentials: "include" }).then((r) => r.json()),
    ]).then(([ents, offs]) => {
      setEntities(ents);
      setOfficials(offs);
    });
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {entities.map((e) => (
            <div key={e.id} className="card-white" style={{ padding: "1.25rem" }}>
              <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{e.name}</h3>
              <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{e.type} • {e.city}</p>
              <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>📞 {e.phone}</p>
              <p style={{ fontSize: "0.78rem", color: "#c3152a", marginTop: "0.35rem", fontWeight: 600 }}>
                {e.officials} مسؤول مسجل
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem" }}>المسؤولون القضائيون</h2>
        <div className="card-white" style={{ padding: "1rem" }}>
          {officials.map((o) => (
            <div
              key={o.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
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
          ))}
        </div>
      </div>
    </AppShell>
  );
}
