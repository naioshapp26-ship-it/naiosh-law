"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  PageStats,
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
  {
    key: "type",
    label: "النوع",
    type: "select",
    required: true,
    options: ["محكمة", "محكمة إدارية", "نيابة", "جهة حكومية"],
  },
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
  const [officialModalOpen, setOfficialModalOpen] = useState(false);
  const { show, Toast: ActionToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [ents, offs] = await Promise.all([
      fetch("/api/official-entities", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/court-officials", { credentials: "include" }).then((r) => r.json()),
    ]);
    setEntities(Array.isArray(ents) ? ents : []);
    setOfficials(Array.isArray(offs) ? offs : []);
    setLoading(false);
  }, []);

  const { seed, seeding, Toast } = useSeedDemo(load);
  useEffect(() => {
    load();
  }, [load]);

  const canWrite = user ? canWriteRole(user.role) : false;
  const isEmpty = entities.length === 0;

  const officialFields: FormField[] = [
    {
      key: "entityName",
      label: "الجهة",
      type: "select",
      options: entities.length ? entities.map((e) => e.name) : ["—"],
    },
    { key: "name", label: "اسم المسؤول", type: "text", required: true },
    {
      key: "role",
      label: "الصفة",
      type: "select",
      required: true,
      options: ["قاضٍ", "أمين سر", "خبير", "وكيل نيابة", "مسؤول"],
    },
    { key: "court", label: "المحكمة", type: "text" },
    { key: "chamber", label: "الدائرة", type: "text" },
    { key: "phone", label: "الهاتف", type: "tel" },
  ];

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
    if (!res.ok) {
      show("error", "فشل إضافة الجهة");
      return;
    }
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
    show("success", "✅ تمت إضافة الجهة");
    setModalOpen(false);
    await load();
  };

  const handleSaveOfficial = async (data: Record<string, unknown>) => {
    const entityName = String(data.entityName ?? "");
    const entityId = entities.find((e) => e.name === entityName)?.id;
    const res = await fetch("/api/court-officials", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        role: data.role,
        entityId,
        court: data.court || entityName,
        chamber: data.chamber,
        phone: data.phone,
        status: "نشط",
      }),
    });
    if (!res.ok) {
      show("error", "فشل إضافة المسؤول");
      return;
    }
    show("success", "✅ تمت إضافة المسؤول");
    setOfficialModalOpen(false);
    await load();
  };

  if (!ready || !user) return null;

  return (
    <AppShell>
      {Toast}
      {ActionToast}
      <div style={{ maxWidth: 1140 }}>
        <PageHeader
          icon="🏢"
          title="الجهات الرسمية والمحاكم"
          subtitle="جهات حكومية ومحاكم ودوائر — قضاة وأمناء سر وخبراء"
          actions={
            <>
              {canWrite && <BtnPrimary onClick={() => setModalOpen(true)}>＋ إضافة جهة</BtnPrimary>}
              {canWrite && (
                <BtnSecondary onClick={() => setOfficialModalOpen(true)}>＋ إضافة مسؤول</BtnSecondary>
              )}
              {canWrite && (
                <button
                  type="button"
                  onClick={seed}
                  disabled={seeding}
                  style={{
                    padding: "0.6rem 1.15rem",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    color: "#475569",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-cairo)",
                  }}
                >
                  {seeding ? "⏳ ..." : "📦 بيانات تجريبية"}
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
            {
              label: "الجهات الحكومية",
              value: entities.filter((e) => e.type === "جهة حكومية").length,
              icon: "🏢",
            },
          ]}
        />

        {loading ? (
          <PageLoader />
        ) : isEmpty ? (
          <EmptyState
            icon="🏢"
            title="لا توجد جهات مسجلة"
            description="أضف محكمة أو جهة حكومية، أو حمّل البيانات التجريبية"
            onSeed={seed}
            onAdd={() => setModalOpen(true)}
            seeding={seeding}
            canWrite={canWrite}
          />
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              {entities.map((e) => (
                <div key={e.id} className="card-white" style={{ padding: "1.35rem", borderRight: "4px solid #c3152a" }}>
                  <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{e.name}</h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {e.type} • {e.city}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>📞 {e.phone || "—"}</p>
                  <p style={{ fontSize: "0.78rem", color: "#c3152a", marginTop: "0.5rem", fontWeight: 700 }}>
                    {e.officials} مسؤول مسجل • {e.status}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0a0a12" }}>المسؤولون القضائيون</h2>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => setOfficialModalOpen(true)}
                  className="btn-primary"
                  style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}
                >
                  ＋ إضافة مسؤول
                </button>
              )}
            </div>
            <div className="card-white" style={{ padding: "0.5rem 1rem" }}>
              {officials.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "1.5rem" }}>لا يوجد مسؤولون مسجلون</p>
              ) : (
                officials.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.85rem 0",
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

      <Modal
        open={modalOpen}
        title="إضافة جهة رسمية"
        fields={entityFields}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        enableParties={false}
      />
      <Modal
        open={officialModalOpen}
        title="إضافة مسؤول قضائي"
        fields={officialFields}
        onSave={handleSaveOfficial}
        onClose={() => setOfficialModalOpen(false)}
        enableParties={false}
        enableFiles={false}
      />
    </AppShell>
  );
}
