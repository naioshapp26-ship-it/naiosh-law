"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  PageStats,
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

const entityFields: FormField[] = [
  { key: "name", label: "اسم الجهة", type: "text", required: true },
  { key: "type", label: "النوع", type: "select", required: true, options: ["محكمة", "محكمة إدارية", "نيابة", "جهة حكومية"] },
  { key: "city", label: "المدينة", type: "text", required: true },
  { key: "phone", label: "الهاتف", type: "tel" },
  { key: "address", label: "العنوان", type: "text" },
];

export default function OfficialEntitiesPage() {
  const { user, ready } = useSession(true);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [ents, offs] = await Promise.all([
      fetch("/api/official-entities", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/court-officials", { credentials: "include" }).then((r) => r.json()),
    ]);
    setEntities(ents);
    setOfficials(offs);
    setLoading(false);
  }, []);

  const { seed, seeding, Toast } = useSeedDemo(load);
  useEffect(() => { load(); }, [load]);

  const canWrite = user ? canWriteRole(user.role) : false;
  const isEmpty = entities.length === 0;

  const handleSave = async (data: Record<string, unknown>) => {
    const attachments = extractAttachments(data);
    const parties = extractPartyFields(data);
    const payload = stripPartyFields(stripAttachments(data));
    const res = await fetch("/api/official-entities", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, status: "نشط" }),
    });
    if (!res.ok) return;
    const created = await res.json();
    if (created?.id && attachments.length) {
      await persistFormAttachments({
        sourceModule: "official-entities",
        sourceId: String(created.id),
        title: String(payload.name ?? ""),
        attachments,
      });
    }
    if (created?.id) {
      await upsertRecordParties({
        sourceModule: "official-entities",
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
          icon="🏢"
          title="الجهات الرسمية والمحاكم"
          subtitle="جهات حكومية ومحاكم ودوائر — قضاة وأمناء سر وخبراء"
          actions={
            <>
              {canWrite && <BtnPrimary onClick={() => setModalOpen(true)}>➕ إضافة جهة</BtnPrimary>}
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
            { label: "الجهات", value: entities.length, icon: "🏛️", color: "#c3152a" },
            { label: "المسؤولون", value: officials.length, icon: "👨‍⚖️" },
            { label: "المحاكم", value: entities.filter((e) => e.type.includes("محكمة")).length, icon: "⚖️" },
            { label: "الجهات الحكومية", value: entities.filter((e) => e.type === "جهة حكومية").length, icon: "🏢" },
          ]}
        />

        {loading ? (
          <PageLoader />
        ) : isEmpty ? (
          <EmptyState icon="🏢" title="لا توجد جهات مسجلة" description="حمّل البيانات التجريبية أو أضف محكمة أو جهة حكومية جديدة" onSeed={seed} onAdd={() => setModalOpen(true)} seeding={seeding} canWrite={canWrite} />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {entities.map((e) => (
                <div key={e.id} className="card-white" style={{ padding: "1.35rem", borderRight: "4px solid #c3152a" }}>
                  <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{e.name}</h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{e.type} • {e.city}</p>
                  <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>📞 {e.phone || "—"}</p>
                  <p style={{ fontSize: "0.78rem", color: "#c3152a", marginTop: "0.5rem", fontWeight: 700 }}>
                    {e.officials} مسؤول مسجل • {e.status}
                  </p>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", color: "#0a0a12" }}>المسؤولون القضائيون</h2>
            <div className="card-white" style={{ padding: "0.5rem 1rem" }}>
              {officials.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "1.5rem" }}>لا يوجد مسؤولون مسجلون</p>
              ) : (
                officials.map((o) => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.85rem 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
                    <span><strong>{o.name}</strong> — {o.role}</span>
                    <span style={{ color: "#64748b" }}>{o.entity?.name ?? o.court} {o.chamber ? `• ${o.chamber}` : ""}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={modalOpen} title="إضافة جهة رسمية" fields={entityFields} onSave={handleSave} onClose={() => setModalOpen(false)} />
    </AppShell>
  );
}
