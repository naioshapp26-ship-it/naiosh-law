"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  PageStats,
  PageTabs,
  BtnPrimary,
  EmptyState,
  PageLoader,
  useSeedDemo,
} from "@/components/domain-page";
import { Modal } from "@/components/ui/modal";
import { useSession, canWriteRole } from "@/lib/session";
import type { FormField } from "@/data/module-configs";
import { extractAttachments, persistFormAttachments, stripAttachments } from "@/lib/form-attachments";
import { extractPartyFields, stripPartyFields } from "@/lib/party-fields";
import { upsertRecordParties } from "@/lib/record-parties-client";

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

const profFields: FormField[] = [
  { key: "name", label: "الاسم", type: "text", required: true },
  { key: "type", label: "النوع", type: "select", required: true, options: ["lawyer", "consultant", "judge"] },
  { key: "licenseNo", label: "رقم الترخيص", type: "text" },
  { key: "phone", label: "الهاتف", type: "tel" },
  { key: "email", label: "البريد", type: "email" },
];

const typeLabel: Record<string, string> = { lawyer: "محامٍ", consultant: "مستشار", judge: "قاضٍ" };

export default function ProfessionalNetworkPage() {
  const { user, ready } = useSession(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [network, setNetwork] = useState<NetworkItem[]>([]);
  const [tab, setTab] = useState("professionals");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [pros, net] = await Promise.all([
      fetch("/api/professionals", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/professional-network", { credentials: "include" }).then((r) => r.json()),
    ]);
    setProfessionals(pros);
    setNetwork(net);
    setLoading(false);
  }, []);

  const { seed, seeding, Toast } = useSeedDemo(load);
  useEffect(() => { load(); }, [load]);

  const canWrite = user ? canWriteRole(user.role) : false;
  const isEmpty = professionals.length === 0 && network.length === 0;

  const handleSave = async (data: Record<string, unknown>) => {
    const attachments = extractAttachments(data);
    const parties = extractPartyFields(data);
    const payload = stripPartyFields(stripAttachments(data));
    const res = await fetch("/api/professionals", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const created = await res.json();
    if (created?.id && attachments.length) {
      await persistFormAttachments({
        sourceModule: "professional-network",
        sourceId: String(created.id),
        title: String(payload.name ?? ""),
        attachments,
      });
    }
    if (created?.id) {
      await upsertRecordParties({
        sourceModule: "professional-network",
        sourceId: String(created.id),
        parties,
      });
    }
    setModalOpen(false);
    await load();
  };

  if (!ready || !user) return null;

  return (
    <AppShell>
      {Toast}
      <div style={{ maxWidth: 1140 }}>
        <PageHeader
          icon="🤝"
          title="الشبكة المهنية"
          subtitle="محامون ومستشارون وقضاة — طلبات تعاون وإحالة قضايا وتبادل آراء"
          actions={
            <>
              {canWrite && tab === "professionals" && (
                <BtnPrimary onClick={() => setModalOpen(true)}>➕ إضافة محترف</BtnPrimary>
              )}
              {isEmpty && (
                <button type="button" onClick={seed} disabled={seeding} style={{ padding: "0.6rem 1.15rem", borderRadius: "12px", border: "1px solid #c3152a", background: "rgba(195,21,42,0.06)", color: "#c3152a", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
                  {seeding ? "⏳ جاري التحميل..." : "📦 بيانات تجريبية"}
                </button>
              )}
            </>
          }
        />

        <PageStats
          stats={[
            { label: "المحترفون", value: professionals.length, icon: "👨‍⚖️", color: "#c3152a" },
            { label: "طلبات الشبكة", value: network.length, icon: "🔗" },
            { label: "المحامون", value: professionals.filter((p) => p.type === "lawyer").length, icon: "⚖️" },
            { label: "المستشارون", value: professionals.filter((p) => p.type === "consultant").length, icon: "💼" },
          ]}
        />

        <PageTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "professionals", label: "المحترفون", count: professionals.length },
            { key: "network", label: "طلبات الشبكة", count: network.length },
          ]}
        />

        {loading ? (
          <PageLoader />
        ) : isEmpty ? (
          <EmptyState icon="🤝" title="لا يوجد محترفون مسجلون" description="حمّل البيانات التجريبية أو أضف محامياً أو مستشاراً جديداً" onSeed={seed} onAdd={() => setModalOpen(true)} seeding={seeding} canWrite={canWrite} />
        ) : tab === "professionals" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {professionals.map((p) => (
              <div key={p.id} className="card-white" style={{ padding: "1.35rem", borderTop: "3px solid #c3152a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontWeight: 800, color: "#0a0a12" }}>{p.name}</h3>
                  <span style={{ fontSize: "0.7rem", background: "rgba(195,21,42,0.1)", color: "#c3152a", padding: "0.2rem 0.5rem", borderRadius: "8px", fontWeight: 700 }}>
                    {typeLabel[p.type] ?? p.type}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>ترخيص: {p.licenseNo}</p>
                <p style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "0.75rem" }}>{p.specializations || "—"}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>⭐ {p.rating}</span>
                  <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600, background: "rgba(34,197,94,0.1)", padding: "0.2rem 0.5rem", borderRadius: "8px" }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-white" style={{ padding: "1rem" }}>
            {network.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>لا توجد طلبات شبكة حالياً</p>
            ) : (
              network.map((n) => (
                <div key={n.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.85rem 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
                  <span><strong>{n.from}</strong> → <strong>{n.to}</strong> ({n.type})</span>
                  <span style={{ color: "#64748b" }}>{n.status} • {n.date}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Modal open={modalOpen} title="إضافة محترف جديد" fields={profFields} onSave={handleSave} onClose={() => setModalOpen(false)} />
    </AppShell>
  );
}
