"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  BtnPrimary,
  BtnSecondary,
  EmptyState,
  PageLoader,
  useSeedDemo,
  useToast,
} from "@/components/domain-page";
import { Modal } from "@/components/ui/modal";
import { useSession, canWriteRole } from "@/lib/session";
import { formatNumber } from "@/lib/format";
import type { FormField } from "@/data/module-configs";

type Tab = "supply" | "shipments" | "international" | "branches" | "alerts";

type Partner = {
  id: string;
  name: string;
  type: string;
  country: string;
  contact: string;
  rating: number;
  shipments: number;
  status: string;
};
type Shipment = {
  id: string;
  refNo: string;
  partner: string;
  caseRef: string;
  origin: string;
  destination: string;
  status: string;
  eta: string;
};
type Matter = {
  id: string;
  refNo: string;
  title: string;
  jurisdiction: string;
  treaty: string;
  client: string;
  type: string;
  status: string;
};
type Branch = {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  isHQ: string;
  alerts: number;
  status: string;
};
type Alert = {
  id: string;
  title: string;
  circularRef: string;
  message: string;
  priority: string;
  status: string;
  dueDate: string;
  branch: string;
};

const tabs: { key: Tab; label: string; addLabel: string }[] = [
  { key: "supply", label: "شركاء التوريد", addLabel: "إضافة شريك" },
  { key: "shipments", label: "الشحنات", addLabel: "إضافة شحنة" },
  { key: "international", label: "القانون الدولي", addLabel: "إضافة قضية دولية" },
  { key: "branches", label: "فروع نايوش", addLabel: "إضافة فرع نايوش" },
  { key: "alerts", label: "تنبيهات دائرية", addLabel: "إضافة تنبيه" },
];

const partnerFields: FormField[] = [
  { key: "name", label: "اسم الشريك", type: "text", required: true },
  {
    key: "type",
    label: "النوع",
    type: "select",
    options: ["مورّد", "ناقل", "وسيط"],
  },
  { key: "country", label: "الدولة", type: "text" },
  { key: "contact", label: "جهة الاتصال", type: "text" },
  { key: "email", label: "البريد الإلكتروني", type: "email" },
  { key: "phone", label: "الهاتف", type: "tel" },
  { key: "rating", label: "التقييم", type: "number" },
];

const shipmentFields: FormField[] = [
  { key: "partnerId", label: "معرّف الشريك", type: "text", placeholder: "id الشريك" },
  { key: "caseRef", label: "مرجع القضية", type: "text" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "origin", label: "المنشأ", type: "text" },
  { key: "destination", label: "الوجهة", type: "text" },
  {
    key: "status",
    label: "الحالة",
    type: "select",
    options: ["قيد الشحن", "تم التسليم", "متأخر"],
  },
  { key: "shipDate", label: "تاريخ الشحن", type: "date" },
  { key: "eta", label: "الوصول المتوقع", type: "date" },
];

const internationalFields: FormField[] = [
  { key: "title", label: "عنوان القضية", type: "text", required: true },
  { key: "jurisdiction", label: "الاختصاص", type: "text" },
  { key: "treaty", label: "الاتفاقية", type: "text" },
  { key: "client", label: "الموكل", type: "text" },
  { key: "type", label: "النوع", type: "text" },
  { key: "openedDate", label: "تاريخ الفتح", type: "date" },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const branchFields: FormField[] = [
  { key: "name", label: "اسم الفرع", type: "text", required: true },
  { key: "code", label: "الرمز", type: "text" },
  { key: "country", label: "الدولة", type: "text", required: true },
  { key: "city", label: "المدينة", type: "text" },
  { key: "manager", label: "المدير", type: "text" },
  { key: "phone", label: "الهاتف", type: "tel" },
  { key: "email", label: "البريد الإلكتروني", type: "email" },
  {
    key: "isHQ",
    label: "مقر رئيسي؟",
    type: "select",
    options: ["نعم", "لا"],
  },
];

const alertFields: FormField[] = [
  { key: "title", label: "عنوان التنبيه", type: "text", required: true },
  { key: "circularRef", label: "مرجع التعميم", type: "text" },
  { key: "message", label: "الرسالة", type: "textarea" },
  {
    key: "priority",
    label: "الأولوية",
    type: "select",
    options: ["عالٍ", "متوسط", "منخفض"],
  },
  {
    key: "status",
    label: "الحالة",
    type: "select",
    options: ["جديد", "مقروء"],
  },
  { key: "dueDate", label: "تاريخ الاستحقاق", type: "date" },
  { key: "branchId", label: "معرّف الفرع (اختياري)", type: "text" },
];

const th: React.CSSProperties = {
  textAlign: "right",
  padding: "0.65rem 0.75rem",
  fontSize: "0.78rem",
  color: "#64748b",
  fontWeight: 700,
  borderBottom: "1px solid #e2e8f0",
};
const td: React.CSSProperties = {
  padding: "0.75rem",
  fontSize: "0.82rem",
  color: "#0a0a12",
  borderBottom: "1px solid #f1f5f9",
};

const ENDPOINTS: Record<Tab, string> = {
  supply: "/api/supply-chain/partners",
  shipments: "/api/supply-chain/shipments",
  international: "/api/international-law",
  branches: "/api/naioch-branches",
  alerts: "/api/circular-alerts",
};

export default function GlobalOperationsPage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("supply");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { show, Toast: ActionToast } = useToast();

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/supply-chain/partners", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/supply-chain/shipments", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/international-law", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/naioch-branches", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/circular-alerts", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([p, s, m, b, a]) => {
        setPartners(Array.isArray(p) ? p : []);
        setShipments(Array.isArray(s) ? s : []);
        setMatters(Array.isArray(m) ? m : []);
        setBranches(Array.isArray(b) ? b : []);
        setAlerts(Array.isArray(a) ? a : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ready && user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.role]);

  const { seed, seeding, Toast } = useSeedDemo(loadAll);

  const ackAlert = async (id: string) => {
    await fetch(`/api/circular-alerts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acknowledge: true, status: "مقروء" }),
    });
    const refreshed = await fetch("/api/circular-alerts", { credentials: "include" }).then((r) =>
      r.json()
    );
    setAlerts(Array.isArray(refreshed) ? refreshed : []);
  };

  const activeTab = tabs.find((t) => t.key === tab)!;
  const formFields =
    tab === "supply"
      ? partnerFields
      : tab === "shipments"
        ? shipmentFields
        : tab === "international"
          ? internationalFields
          : tab === "branches"
            ? branchFields
            : alertFields;

  const handleAdd = async (data: Record<string, unknown>) => {
    let payload: Record<string, unknown> = { ...data };

    if (tab === "supply") {
      payload = {
        ...data,
        rating: data.rating != null && data.rating !== "" ? Number(data.rating) : 0,
      };
    } else if (tab === "branches") {
      payload = {
        ...data,
        isHQ: data.isHQ === "نعم" || data.isHQ === true,
      };
    } else if (tab === "alerts") {
      payload = {
        ...data,
        branchId: data.branchId ? String(data.branchId) : undefined,
      };
      if (!payload.branchId) delete payload.branchId;
    }

    try {
      const res = await fetch(ENDPOINTS[tab], {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        show("error", (err as { error?: string }).error || "فشل الإضافة");
        return;
      }
      show("success", `✅ تمت ${activeTab.addLabel} بنجاح`);
      setAddOpen(false);
      loadAll();
    } catch {
      show("error", "تعذر الاتصال بالخادم");
    }
  };

  if (!ready || !user) return null;

  const canWrite = canWriteRole(user.role);
  const isEmpty =
    !loading &&
    partners.length === 0 &&
    shipments.length === 0 &&
    matters.length === 0 &&
    branches.length === 0 &&
    alerts.length === 0;

  const newAlerts = alerts.filter((a) => a.status === "جديد").length;

  return (
    <AppShell>
      {Toast}
      {ActionToast}
      <div style={{ maxWidth: 1200 }}>
        <PageHeader
          icon="🌍"
          title="العمليات العالمية"
          subtitle="سلسلة التوريد، القانون الدولي، فروع نايوش العالمية، وتنبيهات التعليمات الدائرية"
          actions={
            <>
              {canWrite && (
                <BtnPrimary onClick={() => setAddOpen(true)}>＋ {activeTab.addLabel}</BtnPrimary>
              )}
              {canWrite && (
                <BtnSecondary onClick={seed}>{seeding ? "⏳ ..." : "📦 بيانات تجريبية"}</BtnSecondary>
              )}
            </>
          }
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            { label: "شركاء التوريد", value: partners.length, color: "#0a0a12" },
            { label: "الشحنات", value: shipments.length, color: "#c3152a" },
            { label: "قضايا دولية", value: matters.length, color: "#2563eb" },
            { label: "فروع نايوش", value: branches.length, color: "#22c55e" },
            { label: "تنبيهات جديدة", value: newAlerts, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="card-white" style={{ padding: "1rem 1.1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>{s.label}</p>
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: s.color,
                  fontVariantNumeric: "tabular-nums",
                  direction: "ltr",
                  unicodeBidi: "isolate",
                }}
              >
                {formatNumber(s.value, { maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1.25rem" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: "0.5rem 0.95rem",
                borderRadius: "10px",
                border: tab === t.key ? "1px solid #c3152a" : "1px solid #e2e8f0",
                background: tab === t.key ? "rgba(195,21,42,0.08)" : "#fff",
                color: tab === t.key ? "#c3152a" : "#475569",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
                fontSize: "0.82rem",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <PageLoader />
        ) : isEmpty ? (
          <EmptyState
            icon="🌍"
            title="لا توجد بيانات عمليات"
            description="أضف شريكاً أو فرعاً، أو حمّل البيانات التجريبية"
            onSeed={seed}
            onAdd={canWrite ? () => setAddOpen(true) : undefined}
            seeding={seeding}
            canWrite={canWrite}
          />
        ) : (
          <>
            {tab === "supply" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                }}
              >
                {partners.map((p) => (
                  <div key={p.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <h3 style={{ fontWeight: 800, marginBottom: "0.35rem" }}>{p.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {p.type} • {p.country}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>{p.contact}</p>
                    <p style={{ fontSize: "0.78rem", color: "#f59e0b", marginTop: "0.35rem" }}>
                      ⭐ {p.rating} • {formatNumber(p.shipments, { maximumFractionDigits: 0 })} شحنة
                    </p>
                  </div>
                ))}
                {partners.length === 0 && (
                  <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b", padding: "2rem" }}>
                    لا يوجد شركاء{" "}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="btn-primary"
                        style={{ marginInlineStart: 8, padding: "0.45rem 1rem", fontSize: "0.8rem" }}
                      >
                        ＋ إضافة شريك
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}

            {tab === "shipments" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["المرجع", "الشريك", "القضية", "من", "إلى", "الحالة", "الوصول"].map((h) => (
                        <th key={h} style={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s.id}>
                        <td style={td}>{s.refNo}</td>
                        <td style={td}>{s.partner}</td>
                        <td style={td}>{s.caseRef}</td>
                        <td style={td}>{s.origin}</td>
                        <td style={td}>{s.destination}</td>
                        <td style={td}>{s.status}</td>
                        <td style={td}>{s.eta}</td>
                      </tr>
                    ))}
                    {shipments.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ ...td, textAlign: "center", color: "#64748b" }}>
                          لا توجد شحنات —{" "}
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => setAddOpen(true)}
                              style={{
                                color: "#c3152a",
                                fontWeight: 700,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              ＋ إضافة شحنة
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "international" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["المرجع", "العنوان", "الاختصاص", "الاتفاقية", "الموكل", "الحالة"].map((h) => (
                        <th key={h} style={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matters.map((m) => (
                      <tr key={m.id}>
                        <td style={td}>{m.refNo}</td>
                        <td style={td}>{m.title}</td>
                        <td style={td}>{m.jurisdiction}</td>
                        <td style={td}>{m.treaty}</td>
                        <td style={td}>{m.client}</td>
                        <td style={td}>{m.status}</td>
                      </tr>
                    ))}
                    {matters.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ ...td, textAlign: "center", color: "#64748b" }}>
                          لا توجد قضايا دولية —{" "}
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => setAddOpen(true)}
                              style={{
                                color: "#c3152a",
                                fontWeight: 700,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              ＋ إضافة قضية دولية
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "branches" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                }}
              >
                {branches.map((b) => (
                  <div key={b.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#c3152a", fontWeight: 700 }}>{b.isHQ}</span>
                    <h3 style={{ fontWeight: 800, margin: "0.35rem 0" }}>{b.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {b.code} • {b.city}, {b.country}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "#22c55e", marginTop: "0.5rem" }}>
                      {formatNumber(b.alerts, { maximumFractionDigits: 0 })} تنبيه • {b.status}
                    </p>
                  </div>
                ))}
                {branches.length === 0 && (
                  <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b", padding: "2rem" }}>
                    لا توجد فروع{" "}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="btn-primary"
                        style={{ marginInlineStart: 8, padding: "0.45rem 1rem", fontSize: "0.8rem" }}
                      >
                        ＋ إضافة فرع نايوش
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}

            {tab === "alerts" && (
              <div className="card-white" style={{ padding: "0.5rem 1rem" }}>
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "1rem 0",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "#c3152a", fontWeight: 700 }}>
                        {a.circularRef} • {a.branch}
                      </p>
                      <h3 style={{ fontWeight: 800, fontSize: "0.92rem", margin: "0.25rem 0" }}>{a.title}</h3>
                      <p style={{ fontSize: "0.82rem", color: "#475569" }}>{a.message}</p>
                    </div>
                    <div style={{ textAlign: "left", flexShrink: 0 }}>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: a.priority === "عالٍ" ? "#c3152a" : "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        {a.priority}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#64748b" }}>موعد: {a.dueDate}</p>
                      {a.status === "جديد" && (
                        <button
                          type="button"
                          onClick={() => ackAlert(a.id)}
                          style={{
                            marginTop: "0.35rem",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "7px",
                            border: "none",
                            background: "#c3152a",
                            color: "#fff",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "var(--font-cairo)",
                          }}
                        >
                          تأكيد القراءة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                    لا توجد تنبيهات —{" "}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        style={{
                          color: "#c3152a",
                          fontWeight: 700,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        ＋ إضافة تنبيه
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={addOpen}
        title={activeTab.addLabel}
        fields={formFields}
        onSave={handleAdd}
        onClose={() => setAddOpen(false)}
        saveLabel="إضافة"
        enableParties={false}
        enableFiles={false}
      />
    </AppShell>
  );
}
