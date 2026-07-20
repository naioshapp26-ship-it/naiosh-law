"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  PageStats,
  PageTabs,
  BtnPrimary,
  BtnSecondary,
  EmptyState,
  PageLoader,
  useSeedDemo,
  useToast,
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

const TYPE_MAP: Record<string, string> = {
  محامٍ: "lawyer",
  مستشار: "consultant",
  قاضٍ: "judge",
};

const NETWORK_TYPE_MAP: Record<string, string> = {
  تعاون: "collaboration",
  "إحالة قضية": "case_referral",
  "طلب رأي": "opinion_request",
};

const profFields: FormField[] = [
  { key: "name", label: "الاسم", type: "text", required: true },
  { key: "type", label: "النوع", type: "select", required: true, options: ["محامٍ", "مستشار", "قاضٍ"] },
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
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const { show, Toast: ActionToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [pros, net] = await Promise.all([
      fetch("/api/professionals", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/professional-network", { credentials: "include" }).then((r) => r.json()),
    ]);
    setProfessionals(Array.isArray(pros) ? pros : []);
    setNetwork(Array.isArray(net) ? net : []);
    setLoading(false);
  }, []);

  const { seed, seeding, Toast } = useSeedDemo(load);
  useEffect(() => {
    load();
  }, [load]);

  const canWrite = user ? canWriteRole(user.role) : false;
  const isEmpty = professionals.length === 0 && network.length === 0;

  const networkFields: FormField[] = [
    {
      key: "receiverName",
      label: "المستلم",
      type: "select",
      required: true,
      options: professionals.length ? professionals.map((p) => p.name) : ["—"],
    },
    {
      key: "type",
      label: "نوع الطلب",
      type: "select",
      required: true,
      options: ["تعاون", "إحالة قضية", "طلب رأي"],
    },
    { key: "caseRef", label: "مرجع القضية", type: "text" },
    { key: "message", label: "الرسالة", type: "textarea" },
  ];

  const handleSave = async (data: Record<string, unknown>) => {
    const attachments = extractAttachments(data);
    const parties = extractPartyFields(data);
    const payload = stripPartyFields(stripAttachments(data));
    const res = await fetch("/api/professionals", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        type: TYPE_MAP[String(payload.type)] ?? "lawyer",
        status: "نشط",
      }),
    });
    if (!res.ok) {
      show("error", "فشل إضافة المحترف");
      return;
    }
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
    show("success", "✅ تمت إضافة المحترف");
    setModalOpen(false);
    await load();
  };

  const handleNetworkSave = async (data: Record<string, unknown>) => {
    const receiver = professionals.find((p) => p.name === String(data.receiverName ?? ""));
    if (!receiver) {
      show("error", "اختر مستلمًا من قائمة المحترفين");
      return;
    }
    const res = await fetch("/api/professional-network", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        professionalId: receiver.id,
        type: NETWORK_TYPE_MAP[String(data.type)] ?? "collaboration",
        caseRef: data.caseRef,
        message: data.message,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      show("error", (err as { error?: string }).error || "فشل إرسال طلب الشبكة");
      return;
    }
    show("success", "✅ تم إرسال طلب الشبكة");
    setNetworkModalOpen(false);
    setTab("network");
    await load();
  };

  if (!ready || !user) return null;

  return (
    <AppShell>
      {Toast}
      {ActionToast}
      <div className="erp-page" style={{ width: "100%" }}>
        <PageHeader
          icon="🤝"
          title="الشبكة المهنية"
          subtitle="محامون ومستشارون وقضاة — طلبات تعاون وإحالة قضايا وتبادل آراء"
          actions={
            <>
              {canWrite && tab === "professionals" && (
                <BtnPrimary onClick={() => setModalOpen(true)}>＋ إضافة محترف</BtnPrimary>
              )}
              {canWrite && tab === "network" && (
                <BtnPrimary onClick={() => setNetworkModalOpen(true)}>＋ إضافة طلب شبكة</BtnPrimary>
              )}
              {canWrite && <BtnSecondary onClick={seed}>{seeding ? "⏳ ..." : "📦 بيانات تجريبية"}</BtnSecondary>}
            </>
          }
        />

        <PageStats
          stats={[
            { label: "المحترفون", value: professionals.length, icon: "👨‍⚖️", color: "#c3152a" },
            { label: "طلبات الشبكة", value: network.length, icon: "🔗" },
            { label: "المحامون", value: professionals.filter((p) => p.type === "lawyer").length, icon: "⚖️" },
            {
              label: "المستشارون",
              value: professionals.filter((p) => p.type === "consultant").length,
              icon: "💼",
            },
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
          <EmptyState
            icon="🤝"
            title="لا يوجد محترفون مسجلون"
            description="أضف محامياً أو مستشاراً، أو حمّل البيانات التجريبية"
            onSeed={seed}
            onAdd={() => setModalOpen(true)}
            seeding={seeding}
            canWrite={canWrite}
          />
        ) : tab === "professionals" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {professionals.map((p) => (
              <div key={p.id} className="card-white" style={{ padding: "1.35rem", borderTop: "3px solid #c3152a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontWeight: 800, color: "#0a0a12" }}>{p.name}</h3>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: "rgba(195,21,42,0.1)",
                      color: "#c3152a",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "8px",
                      fontWeight: 700,
                    }}
                  >
                    {typeLabel[p.type] ?? p.type}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>ترخيص: {p.licenseNo}</p>
                <p style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "0.75rem" }}>{p.specializations || "—"}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>⭐ {p.rating}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#22c55e",
                      fontWeight: 600,
                      background: "rgba(34,197,94,0.1)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "8px",
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-white" style={{ padding: "1rem" }}>
            {network.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "#64748b", marginBottom: "0.85rem" }}>لا توجد طلبات شبكة حالياً</p>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setNetworkModalOpen(true)}
                    className="btn-primary"
                    style={{ padding: "0.5rem 1.1rem", fontSize: "0.85rem" }}
                  >
                    ＋ إضافة طلب شبكة
                  </button>
                )}
              </div>
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
                  <span style={{ color: "#64748b" }}>
                    {n.status} • {n.date}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="إضافة محترف جديد"
        fields={profFields}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        enableParties={false}
      />
      <Modal
        open={networkModalOpen}
        title="إضافة طلب شبكة"
        fields={networkFields}
        onSave={handleNetworkSave}
        onClose={() => setNetworkModalOpen(false)}
        enableParties={false}
        enableFiles={false}
      />
    </AppShell>
  );
}
