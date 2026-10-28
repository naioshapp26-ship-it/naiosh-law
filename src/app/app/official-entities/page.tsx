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
import {
  SettingsAppliedChrome,
  SettingsLinkButton,
  specBool,
} from "@/components/page-settings/settings-applied-chrome";
import { Modal } from "@/components/ui/modal";
import { useSession, canWriteRole } from "@/lib/session";
import type { FormField } from "@/data/module-configs";
import { extractAttachments, persistFormAttachments, stripAttachments } from "@/lib/form-attachments";
import { extractPartyFields, stripPartyFields } from "@/lib/party-fields";
import { upsertRecordParties } from "@/lib/record-parties-client";
import { usePageSettings } from "@/lib/page-settings/use-page-settings";
import { SettingsDrivenSections } from "@/components/page-settings/settings-driven-sections";

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
  phone?: string | null;
  phoneDialCode?: string | null;
  phoneSecondary?: string | null;
  phoneSecondaryDialCode?: string | null;
  country?: string | null;
  city?: string | null;
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
  const pageSettings = usePageSettings("official-entities");
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
    {
      key: "phoneDialCode",
      label: "مفتاح الدولة",
      type: "select",
      required: true,
      options: ["+20 (مصر)", "+966 (السعودية)", "+971 (الإمارات)", "+965 (الكويت)", "+974 (قطر)", "+962 (الأردن)"],
    },
    { key: "phone", label: "رقم الجوال", type: "tel", required: true, placeholder: "5XXXXXXXX" },
    {
      key: "country",
      label: "الدولة",
      type: "select",
      required: true,
      options: ["مصر", "السعودية", "الإمارات", "الكويت", "قطر", "الأردن", "أخرى"],
    },
    { key: "city", label: "المدينة", type: "text", required: true, dependsOn: "country" },
    {
      key: "phoneSecondaryDialCode",
      label: "مفتاح الجوال الإضافي",
      type: "select",
      options: ["+20 (مصر)", "+966 (السعودية)", "+971 (الإمارات)", "+962 (الأردن)"],
    },
    { key: "phoneSecondary", label: "رقم جوال إضافي", type: "tel", placeholder: "اختياري" },
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
    const attachments = extractAttachments(data);
    const clean = stripAttachments(data);
    const entityName = String(clean.entityName ?? "");
    const entityId = entities.find((e) => e.name === entityName)?.id;
    const res = await fetch("/api/court-officials", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: clean.name,
        role: clean.role,
        entityId,
        court: clean.court || entityName,
        chamber: clean.chamber,
        phone: clean.phone,
        phoneDialCode: clean.phoneDialCode,
        phoneSecondary: clean.phoneSecondary,
        phoneSecondaryDialCode: clean.phoneSecondaryDialCode,
        country: clean.country,
        city: clean.city,
        status: "نشط",
      }),
    });
    if (!res.ok) {
      show("error", "فشل إضافة المسؤول");
      return;
    }
    const created = await res.json().catch(() => ({}));
    const recordId = String((created as { id?: string }).id ?? "");
    if (recordId && attachments.length) {
      await persistFormAttachments({
        sourceModule: "court-officials",
        sourceId: recordId,
        title: String(clean.name ?? "مسؤول قضائي"),
        attachments,
      });
    }
    show(
      "success",
      attachments.length ? `✅ تمت إضافة المسؤول مع ${attachments.length} مرفق` : "✅ تمت إضافة المسؤول"
    );
    setOfficialModalOpen(false);
    await load();
  };

  const allowCreate = pageSettings.actions?.allowCreate !== false;
  const showEntities = specBool(pageSettings, "showEntities", true);
  const showOfficials = specBool(pageSettings, "showOfficials", true);

  if (!ready || !user) return null;

  return (
    <AppShell>
      {Toast}
      {ActionToast}
      <div className="erp-page" style={{ width: "100%" }}>
        <SettingsAppliedChrome pageKey="official-entities" settings={pageSettings} />
      <SettingsDrivenSections pageKey="official-entities" />
        <PageHeader
          icon="🏢"
          title={pageSettings.display?.title?.trim() || "الجهات الرسمية والمحاكم"}
          subtitle={
            pageSettings.display?.subtitle?.trim() ||
            "جهات حكومية ومحاكم ودوائر — قضاة وأمناء سر وخبراء"
          }
          actions={
            <>
              <SettingsLinkButton pageKey="official-entities" />
              {canWrite && allowCreate && <BtnPrimary onClick={() => setModalOpen(true)}>＋ إضافة جهة</BtnPrimary>}
              {canWrite && allowCreate && (
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

        {pageSettings.display?.showKpis !== false ? (
          <PageStats
            stats={[
              { label: "الجهات", value: entities.length, icon: "🏛️", color: "#101D32" },
              { label: "المسؤولون", value: officials.length, icon: "👨‍⚖️" },
              { label: "المحاكم", value: entities.filter((e) => e.type.includes("محكمة")).length, icon: "⚖️" },
              {
                label: "الجهات الحكومية",
                value: entities.filter((e) => e.type === "جهة حكومية").length,
                icon: "🏢",
              },
            ]}
          />
        ) : null}

        {loading ? (
          <PageLoader />
        ) : isEmpty ? (
          <EmptyState
            icon="🏢"
            title="لا توجد جهات مسجلة"
            description="أضف محكمة أو جهة حكومية، أو حمّل البيانات التجريبية"
            onSeed={seed}
            onAdd={allowCreate ? () => setModalOpen(true) : undefined}
            seeding={seeding}
            canWrite={canWrite}
          />
        ) : (
          <>
            {showEntities ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem",
                  marginBottom: "2rem",
                }}
              >
                {entities.map((e) => (
                  <div key={e.id} className="card-white" style={{ padding: "1.35rem", borderRight: "4px solid #101D32" }}>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{e.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {e.type} • {e.city}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>📞 {e.phone || "—"}</p>
                    <p style={{ fontSize: "0.78rem", color: "#101D32", marginTop: "0.5rem", fontWeight: 700 }}>
                      {e.officials} مسؤول مسجل • {e.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {showOfficials ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0a0a12" }}>المسؤولون القضائيون</h2>
                  {canWrite && allowCreate && (
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
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
                            {[o.phoneDialCode, o.phone].filter(Boolean).join(" ") || "غير مسجل"}
                            {" · "}
                            {[o.country, o.city].filter(Boolean).join(" / ") || "غير مسجل"}
                            {o.phoneSecondary
                              ? ` · إضافي: ${[o.phoneSecondaryDialCode, o.phoneSecondary].filter(Boolean).join(" ")}`
                              : ""}
                          </div>
                        </span>
                        <span style={{ color: "#64748b" }}>
                          {o.entity?.name ?? o.court} {o.chamber ? `• ${o.chamber}` : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
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
        enableFiles
      />
    </AppShell>
  );
}
