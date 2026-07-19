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

type Tab = "branches" | "rules" | "logs" | "integrations" | "send";

type Branch = {
  id: string;
  name: string;
  code: string;
  city: string;
  phone: string;
  manager: string;
  status: string;
  isMain: string;
  users: number;
};

type Rule = {
  id: string;
  title: string;
  trigger: string;
  channel: string;
  audience: string;
  branch: string;
  sent: number;
  status: string;
};

type NotifLog = {
  id: string;
  rule: string;
  channel: string;
  recipient: string;
  provider: string;
  status: string;
  sentAt: string;
};

type Integration = {
  id: string;
  name: string;
  type: string;
  provider: string;
  endpoint: string;
  callsToday: number;
  successRate: string;
  lastChecked: string;
  status: string;
};

const tabs: { key: Tab; label: string; addLabel?: string }[] = [
  { key: "branches", label: "فروع المكتب", addLabel: "إضافة فرع" },
  { key: "rules", label: "قواعد الإشعار", addLabel: "إضافة قاعدة إشعار" },
  { key: "logs", label: "سجل الإشعارات" },
  { key: "integrations", label: "التكاملات", addLabel: "إضافة تكامل" },
  { key: "send", label: "إرسال تجريبي" },
];

const CHANNEL_MAP: Record<string, string> = {
  بريد: "email",
  رسالة: "sms",
  واتساب: "whatsapp",
  "داخل النظام": "in_app",
};

const INTEGRATION_TYPE_MAP: Record<string, string> = {
  بريد: "email",
  رسالة: "sms",
  واتساب: "whatsapp",
  مدفوعات: "payment",
  Webhook: "webhook",
  أخرى: "other",
};

const branchFields: FormField[] = [
  { key: "name", label: "اسم الفرع", type: "text", required: true },
  { key: "code", label: "الرمز", type: "text", placeholder: "RYD" },
  { key: "city", label: "المدينة", type: "text" },
  { key: "address", label: "العنوان", type: "text" },
  { key: "phone", label: "الهاتف", type: "tel" },
  { key: "email", label: "البريد", type: "email" },
  { key: "manager", label: "المدير", type: "text" },
  { key: "status", label: "الحالة", type: "select", options: ["نشط", "موقوف"] },
  { key: "isMain", label: "فرع رئيسي", type: "select", options: ["نعم", "لا"] },
];

const ruleFields: FormField[] = [
  { key: "title", label: "عنوان القاعدة", type: "text", required: true },
  { key: "trigger", label: "المحرك", type: "text", placeholder: "عند إنشاء قضية" },
  {
    key: "channel",
    label: "القناة",
    type: "select",
    options: ["بريد", "رسالة", "واتساب", "داخل النظام"],
  },
  { key: "audience", label: "المستقبل", type: "text", placeholder: "الجميع" },
  { key: "status", label: "الحالة", type: "select", options: ["نشط", "موقف"] },
  { key: "templateBody", label: "نص القالب", type: "textarea" },
];

const integrationFields: FormField[] = [
  { key: "name", label: "اسم التكامل", type: "text", required: true },
  {
    key: "type",
    label: "النوع",
    type: "select",
    options: ["بريد", "رسالة", "واتساب", "مدفوعات", "Webhook", "أخرى"],
  },
  { key: "provider", label: "المزود", type: "text", placeholder: "Resend / Twilio" },
  { key: "endpoint", label: "Endpoint", type: "text" },
  { key: "apiKey", label: "مفتاح API", type: "text" },
  { key: "status", label: "الحالة", type: "select", options: ["متصل", "مقطوع"] },
];

const thStyle: React.CSSProperties = {
  textAlign: "right",
  padding: "0.65rem 0.75rem",
  fontSize: "0.78rem",
  color: "#64748b",
  fontWeight: 700,
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  fontSize: "0.82rem",
  color: "#0a0a12",
  borderBottom: "1px solid #f1f5f9",
};

const inputStyle: React.CSSProperties = {
  padding: "0.65rem 0.85rem",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontFamily: "var(--font-cairo)",
  fontSize: "0.85rem",
  width: "100%",
};

const btnStyle: React.CSSProperties = {
  padding: "0.7rem 1rem",
  borderRadius: "10px",
  border: "none",
  background: "#c3152a",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "var(--font-cairo)",
};

export default function CommunicationsPage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("branches");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setNotifLogs] = useState<NotifLog[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  const [sendForm, setSendForm] = useState({
    channel: "email",
    recipient: "",
    subject: "",
    body: "",
  });
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const { show, Toast: ActionToast } = useToast();

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/office-branches", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/notification-rules", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/notification-logs", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/integrations", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([b, r, l, i]) => {
        setBranches(Array.isArray(b) ? b : []);
        setRules(Array.isArray(r) ? r : []);
        setNotifLogs(Array.isArray(l) ? l : []);
        setIntegrations(Array.isArray(i) ? i : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ready && user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const { seed, seeding, Toast } = useSeedDemo(loadAll);

  const testIntegration = async (id: string) => {
    setTestingId(id);
    const res = await fetch(`/api/integrations/${id}`, { method: "POST", credentials: "include" });
    const data = await res.json();
    setSendResult(data.message ?? (data.success ? "الاتصال ناجح" : "فشل الاتصال"));
    loadAll();
    setTestingId(null);
  };

  const sendTest = async () => {
    setSendResult(null);
    const res = await fetch("/api/notifications/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setSendResult(data.error ?? "فشل الإرسال");
      return;
    }
    setSendResult(
      data.simulated
        ? `تمت المحاكاة: ${data.status} (${data.provider})`
        : `تم الإرسال: ${data.status} (${data.provider})`
    );
    loadAll();
  };

  const activeTab = tabs.find((t) => t.key === tab)!;
  const canAdd = Boolean(activeTab.addLabel);
  const formFields =
    tab === "branches" ? branchFields : tab === "rules" ? ruleFields : integrationFields;

  const handleAdd = async (data: Record<string, unknown>) => {
    const endpoint =
      tab === "branches"
        ? "/api/office-branches"
        : tab === "rules"
          ? "/api/notification-rules"
          : "/api/integrations";

    const payload =
      tab === "branches"
        ? {
            ...data,
            status: data.status || "نشط",
            isMain: data.isMain === "نعم",
          }
        : tab === "rules"
          ? {
              ...data,
              channel: CHANNEL_MAP[String(data.channel)] ?? "email",
              audience: data.audience || "الجميع",
              status: data.status || "نشط",
            }
          : {
              ...data,
              type: INTEGRATION_TYPE_MAP[String(data.type)] ?? "other",
              provider: data.provider || "custom",
              status: data.status || "متصل",
            };

    try {
      const res = await fetch(endpoint, {
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
  const isEmpty = !loading && branches.length === 0 && rules.length === 0 && integrations.length === 0;

  return (
    <AppShell>
      {Toast}
      {ActionToast}
      <div style={{ maxWidth: 1200 }}>
        <PageHeader
          icon="🛎️"
          title="الإشعارات والتكاملات"
          subtitle="فروع متعددة، قواعد إشعار، Resend للبريد، Twilio للرسائل والواتساب"
          actions={
            <>
              {canWrite && canAdd && (
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
            { label: "الفروع", value: branches.length, color: "#0a0a12" },
            { label: "قواعد نشطة", value: rules.filter((r) => r.status === "نشط").length, color: "#22c55e" },
            { label: "تكاملات", value: integrations.length, color: "#0ea5e9" },
            { label: "إشعارات اليوم", value: logs.length, color: "#c3152a" },
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
            icon="🛎️"
            title="لا توجد بيانات اتصالات"
            description="أضف فرعاً أو قاعدة إشعار، أو حمّل البيانات التجريبية"
            onSeed={seed}
            onAdd={canWrite && canAdd ? () => setAddOpen(true) : undefined}
            seeding={seeding}
            canWrite={canWrite}
          />
        ) : (
          <>
            {tab === "branches" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {branches.map((b) => (
                  <div key={b.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: b.isMain === "رئيسي" ? "#c3152a" : "#64748b",
                        }}
                      >
                        {b.isMain}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{b.code}</span>
                    </div>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{b.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {b.city} • {b.manager}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>📞 {b.phone}</p>
                    <p style={{ fontSize: "0.78rem", color: "#22c55e", marginTop: "0.35rem", fontWeight: 600 }}>
                      {formatNumber(b.users, { maximumFractionDigits: 0 })} مستخدم • {b.status}
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
                        ＋ إضافة فرع
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}

            {tab === "rules" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["العنوان", "المحرك", "القناة", "المستقبل", "الفرع", "مُرسَل", "الحالة"].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id}>
                        <td style={tdStyle}>{r.title}</td>
                        <td style={tdStyle}>{r.trigger}</td>
                        <td style={tdStyle}>{r.channel}</td>
                        <td style={tdStyle}>{r.audience}</td>
                        <td style={tdStyle}>{r.branch}</td>
                        <td style={tdStyle}>{formatNumber(r.sent, { maximumFractionDigits: 0 })}</td>
                        <td style={{ ...tdStyle, color: r.status === "نشط" ? "#22c55e" : "#94a3b8" }}>{r.status}</td>
                      </tr>
                    ))}
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                          لا توجد قواعد —{" "}
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
                              ＋ إضافة قاعدة إشعار
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "logs" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["القاعدة", "القناة", "المستلم", "المزود", "الحالة", "الوقت"].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td style={tdStyle}>{l.rule}</td>
                        <td style={tdStyle}>{l.channel}</td>
                        <td style={tdStyle}>{l.recipient}</td>
                        <td style={tdStyle}>{l.provider}</td>
                        <td style={tdStyle}>{l.status}</td>
                        <td style={tdStyle}>{l.sentAt}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                          لا توجد سجلات إشعار
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "integrations" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["الاسم", "النوع", "المزود", "Endpoint", "استدعاءات", "النجاح", "الحالة", ""].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {integrations.map((i) => (
                      <tr key={i.id}>
                        <td style={tdStyle}>{i.name}</td>
                        <td style={tdStyle}>{i.type}</td>
                        <td style={tdStyle}>{i.provider}</td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.75rem" }}>{i.endpoint}</td>
                        <td style={tdStyle}>{formatNumber(i.callsToday, { maximumFractionDigits: 0 })}</td>
                        <td style={tdStyle}>{i.successRate}</td>
                        <td style={{ ...tdStyle, color: i.status === "متصل" ? "#22c55e" : "#f59e0b" }}>{i.status}</td>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => testIntegration(i.id)}
                            disabled={testingId === i.id}
                            style={{
                              padding: "0.35rem 0.65rem",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-cairo)",
                            }}
                          >
                            {testingId === i.id ? "..." : "اختبار"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {integrations.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                          لا توجد تكاملات —{" "}
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
                              ＋ إضافة تكامل
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "send" && (
              <div className="card-white" style={{ padding: "1.5rem", maxWidth: 520 }}>
                <h3 style={{ fontWeight: 800, marginBottom: "1rem" }}>إرسال إشعار تجريبي</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <select
                    value={sendForm.channel}
                    onChange={(e) => setSendForm({ ...sendForm, channel: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="email">بريد إلكتروني (Resend)</option>
                    <option value="sms">رسالة نصية (Twilio)</option>
                    <option value="whatsapp">واتساب (Twilio)</option>
                    <option value="in_app">إشعار النظام</option>
                  </select>
                  <input
                    placeholder="المستلم (بريد أو رقم هاتف)"
                    value={sendForm.recipient}
                    onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
                    style={inputStyle}
                  />
                  {sendForm.channel === "email" && (
                    <input
                      placeholder="الموضوع"
                      value={sendForm.subject}
                      onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                      style={inputStyle}
                    />
                  )}
                  <textarea
                    placeholder="نص الرسالة"
                    rows={4}
                    value={sendForm.body}
                    onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  <button type="button" onClick={sendTest} style={btnStyle}>
                    إرسال
                  </button>
                  {sendResult && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: sendResult.includes("فشل") ? "#c3152a" : "#22c55e",
                        fontWeight: 600,
                      }}
                    >
                      {sendResult}
                    </p>
                  )}
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                    بدون مفاتيح API يعمل النظام في وضع المحاكاة ويسجل الإشعارات في قاعدة البيانات.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {canAdd && (
        <Modal
          open={addOpen}
          title={activeTab.addLabel || "إضافة"}
          fields={formFields}
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
          saveLabel="إضافة"
          enableParties={false}
          enableFiles={false}
        />
      )}
    </AppShell>
  );
}
