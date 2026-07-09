"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/lib/session";

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

const tabs: { key: Tab; label: string }[] = [
  { key: "branches", label: "فروع المكتب" },
  { key: "rules", label: "قواعد الإشعار" },
  { key: "logs", label: "سجل الإشعارات" },
  { key: "integrations", label: "التكاملات" },
  { key: "send", label: "إرسال تجريبي" },
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

async function fetchList<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function CommunicationsPage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("branches");
  const [loading, setLoading] = useState(true);

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

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r, l, i] = await Promise.all([
        fetchList<Branch>("/api/office-branches"),
        fetchList<Rule>("/api/notification-rules"),
        fetchList<NotifLog>("/api/notification-logs"),
        fetchList<Integration>("/api/integrations"),
      ]);
      setBranches(b);
      setRules(r);
      setNotifLogs(l);
      setIntegrations(i);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadAll);
  }, [loadAll]);

  const testIntegration = async (id: string) => {
    setTestingId(id);
    const res = await fetch(`/api/integrations/${id}`, { method: "POST", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    setSendResult(data.message ?? (data.success ? "الاتصال ناجح" : "فشل الاتصال"));
    await loadAll();
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSendResult(data.error ?? "فشل الإرسال");
      return;
    }
    setSendResult(
      data.simulated
        ? `تمت المحاكاة: ${data.status} (${data.provider})`
        : `تم الإرسال: ${data.status} (${data.provider})`
    );
    await loadAll();
  };

  if (!ready || !user) return null;

  return (
    <AppShell role={user.role} name={user.name}>
      <div style={{ maxWidth: 1200 }}>
        <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.35rem" }}>
          🛎️ الإشعارات والتكاملات
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          فروع متعددة، قواعد إشعار، Resend للبريد، Twilio للرسائل والواتساب
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "الفروع", value: branches.length, color: "#0a0a12" },
            { label: "قواعد نشطة", value: rules.filter((r) => r.status === "نشط").length, color: "#22c55e" },
            { label: "تكاملات", value: integrations.length, color: "#0ea5e9" },
            { label: "إشعارات اليوم", value: logs.length, color: "#c3152a" },
          ].map((s) => (
            <div key={s.label} className="card-white" style={{ padding: "1rem 1.1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>{s.label}</p>
              <p style={{ fontWeight: 800, fontSize: "1.05rem", color: s.color }}>{s.value}</p>
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
          <p style={{ color: "#64748b" }}>جاري التحميل...</p>
        ) : (
          <>
            {tab === "branches" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {branches.map((b) => (
                  <div key={b.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: b.isMain === "رئيسي" ? "#c3152a" : "#64748b" }}>{b.isMain}</span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{b.code}</span>
                    </div>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{b.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{b.city} • {b.manager}</p>
                    <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>📞 {b.phone}</p>
                    <p style={{ fontSize: "0.78rem", color: "#22c55e", marginTop: "0.35rem", fontWeight: 600 }}>
                      {b.users} مستخدم • {b.status}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {tab === "rules" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["العنوان", "المحرك", "القناة", "المستقبل", "الفرع", "مُرسَل", "الحالة"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
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
                        <td style={tdStyle}>{r.sent}</td>
                        <td style={{ ...tdStyle, color: r.status === "نشط" ? "#22c55e" : "#94a3b8" }}>{r.status}</td>
                      </tr>
                    ))}
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
                        <th key={h} style={thStyle}>{h}</th>
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
                        <th key={h} style={thStyle}>{h}</th>
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
                        <td style={tdStyle}>{i.callsToday}</td>
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
                    <p style={{ fontSize: "0.85rem", color: sendResult.includes("فشل") ? "#c3152a" : "#22c55e", fontWeight: 600 }}>
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
    </AppShell>
  );
}

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
