"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, BtnPrimary, EmptyState, PageLoader, useSeedDemo } from "@/components/domain-page";
import { useSession, canWriteRole } from "@/lib/session";

type Tab = "supply" | "shipments" | "international" | "branches" | "alerts";

type Partner = { id: string; name: string; type: string; country: string; contact: string; rating: number; shipments: number; status: string };
type Shipment = { id: string; refNo: string; partner: string; caseRef: string; origin: string; destination: string; status: string; eta: string };
type Matter = { id: string; refNo: string; title: string; jurisdiction: string; treaty: string; client: string; type: string; status: string };
type Branch = { id: string; name: string; code: string; country: string; city: string; isHQ: string; alerts: number; status: string };
type Alert = { id: string; title: string; circularRef: string; message: string; priority: string; status: string; dueDate: string; branch: string };

const tabs: { key: Tab; label: string }[] = [
  { key: "supply", label: "شركاء التوريد" },
  { key: "shipments", label: "الشحنات" },
  { key: "international", label: "القانون الدولي" },
  { key: "branches", label: "فروع نايوش" },
  { key: "alerts", label: "تنبيهات دائرية" },
];

const th: React.CSSProperties = { textAlign: "right", padding: "0.65rem 0.75rem", fontSize: "0.78rem", color: "#64748b", fontWeight: 700, borderBottom: "1px solid #e2e8f0" };
const td: React.CSSProperties = { padding: "0.75rem", fontSize: "0.82rem", color: "#0a0a12", borderBottom: "1px solid #f1f5f9" };

export default function GlobalOperationsPage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("supply");
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      fetch("/api/supply-chain/partners", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/supply-chain/shipments", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/international-law", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/naioch-branches", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/circular-alerts", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([p, s, m, b, a]) => {
        setPartners(p);
        setShipments(s);
        setMatters(m);
        setBranches(b);
        setAlerts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const { seed, seeding, Toast } = useSeedDemo(load);

  useEffect(() => {
    load();
  }, [load]);

  const ackAlert = async (id: string) => {
    await fetch(`/api/circular-alerts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acknowledge: true, status: "مقروء" }),
    });
    const refreshed = await fetch("/api/circular-alerts", { credentials: "include" }).then((r) => r.json());
    setAlerts(refreshed);
  };

  if (!ready || !user) return null;

  const canWrite = canWriteRole(user.role);
  const isEmpty = !loading && partners.length === 0 && branches.length === 0;

  return (
    <AppShell role={user.role} name={user.name}>
      {Toast}
      <div style={{ maxWidth: 1200 }}>
        <PageHeader
          icon="🌍"
          title="العمليات العالمية"
          subtitle="سلسلة التوريد، القانون الدولي، فروع نايوش العالمية، وتنبيهات التعليمات الدائرية"
          actions={
            <>
              {canWrite && <BtnPrimary onClick={seed}>➕ تحميل بيانات</BtnPrimary>}
              {isEmpty && (
                <button type="button" onClick={seed} disabled={seeding} style={{ padding: "0.6rem 1.15rem", borderRadius: "12px", border: "1px solid #c3152a", background: "rgba(195,21,42,0.06)", color: "#c3152a", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
                  {seeding ? "⏳ جاري التحميل..." : "📦 بيانات تجريبية"}
                </button>
              )}
            </>
          }
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1.25rem" }}>
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} style={{
              padding: "0.5rem 0.95rem", borderRadius: "10px",
              border: tab === t.key ? "1px solid #c3152a" : "1px solid #e2e8f0",
              background: tab === t.key ? "rgba(195,21,42,0.08)" : "#fff",
              color: tab === t.key ? "#c3152a" : "#475569", fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-cairo)", fontSize: "0.82rem",
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? <PageLoader /> : isEmpty ? (
          <EmptyState icon="🌍" title="لا توجد بيانات عمليات" description="حمّل البيانات التجريبية لتظهر شركاء التوريد والفروع العالمية" onSeed={seed} seeding={seeding} canWrite={canWrite} />
        ) : (
          <>
            {tab === "supply" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {partners.map((p) => (
                  <div key={p.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <h3 style={{ fontWeight: 800, marginBottom: "0.35rem" }}>{p.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{p.type} • {p.country}</p>
                    <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>{p.contact}</p>
                    <p style={{ fontSize: "0.78rem", color: "#f59e0b", marginTop: "0.35rem" }}>⭐ {p.rating} • {p.shipments} شحنة</p>
                  </div>
                ))}
              </div>
            )}

            {tab === "shipments" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["المرجع", "الشريك", "القضية", "من", "إلى", "الحالة", "الوصول"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>{shipments.map((s) => (
                    <tr key={s.id}>
                      <td style={td}>{s.refNo}</td><td style={td}>{s.partner}</td><td style={td}>{s.caseRef}</td>
                      <td style={td}>{s.origin}</td><td style={td}>{s.destination}</td>
                      <td style={td}>{s.status}</td><td style={td}>{s.eta}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {tab === "international" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["المرجع", "العنوان", "الاختصاص", "الاتفاقية", "الموكل", "الحالة"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>{matters.map((m) => (
                    <tr key={m.id}>
                      <td style={td}>{m.refNo}</td><td style={td}>{m.title}</td><td style={td}>{m.jurisdiction}</td>
                      <td style={td}>{m.treaty}</td><td style={td}>{m.client}</td><td style={td}>{m.status}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {tab === "branches" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {branches.map((b) => (
                  <div key={b.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#c3152a", fontWeight: 700 }}>{b.isHQ}</span>
                    <h3 style={{ fontWeight: 800, margin: "0.35rem 0" }}>{b.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{b.code} • {b.city}, {b.country}</p>
                    <p style={{ fontSize: "0.78rem", color: "#22c55e", marginTop: "0.5rem" }}>{b.alerts} تنبيه • {b.status}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === "alerts" && (
              <div className="card-white" style={{ padding: "0.5rem 1rem" }}>
                {alerts.map((a) => (
                  <div key={a.id} style={{ padding: "1rem 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "#c3152a", fontWeight: 700 }}>{a.circularRef} • {a.branch}</p>
                      <h3 style={{ fontWeight: 800, fontSize: "0.92rem", margin: "0.25rem 0" }}>{a.title}</h3>
                      <p style={{ fontSize: "0.82rem", color: "#475569" }}>{a.message}</p>
                    </div>
                    <div style={{ textAlign: "left", flexShrink: 0 }}>
                      <p style={{ fontSize: "0.75rem", color: a.priority === "عالٍ" ? "#c3152a" : "#64748b", fontWeight: 600 }}>{a.priority}</p>
                      <p style={{ fontSize: "0.75rem", color: "#64748b" }}>موعد: {a.dueDate}</p>
                      {a.status === "جديد" && (
                        <button type="button" onClick={() => ackAlert(a.id)} style={{ marginTop: "0.35rem", padding: "0.3rem 0.6rem", borderRadius: "7px", border: "none", background: "#c3152a", color: "#fff", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
                          تأكيد القراءة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
