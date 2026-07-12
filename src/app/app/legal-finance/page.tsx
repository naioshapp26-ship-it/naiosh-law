"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, BtnPrimary, EmptyState, PageLoader, useSeedDemo } from "@/components/domain-page";
import { useSession, canWriteRole } from "@/lib/session";

type Tab =
  | "invoices"
  | "fee-rules"
  | "calculator"
  | "bail"
  | "personal"
  | "notifications"
  | "payments";

type Invoice = {
  id: string;
  invoiceNo: string;
  client: string;
  type: string;
  amount: string;
  paid: string;
  issueDate: string;
  status: string;
};

type FeeRule = {
  id: string;
  name: string;
  caseType: string;
  specialization: string;
  stage: string;
  hourlyRate: number;
  fixedAmount: number;
  percentRate: number;
  active: string;
};

type BailItem = {
  id: string;
  caseRef: string;
  client: string;
  amount: string;
  court: string;
  status: string;
  depositDate: string;
  refundDate: string;
};

type PersonalItem = {
  id: string;
  caseRef: string;
  client: string;
  guarantor: string;
  relationship: string;
  status: string;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  entity: string;
  caseRef: string;
  dueDate: string;
  status: string;
};

type PaymentItem = {
  id: string;
  invoiceNo: string;
  client: string;
  amount: string;
  method: string;
  paidAt: string;
};

type Spec = { id: string; name: string };

const tabs: { key: Tab; label: string }[] = [
  { key: "invoices", label: "الفواتير" },
  { key: "fee-rules", label: "قواعد الأتعاب" },
  { key: "calculator", label: "حاسبة الأتعاب" },
  { key: "bail", label: "كفالات مالية" },
  { key: "personal", label: "ضمانات شخصية" },
  { key: "notifications", label: "إشعارات رسمية" },
  { key: "payments", label: "المدفوعات" },
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

export default function LegalFinancePage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("invoices");
  const [loading, setLoading] = useState(true);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
  const [bailItems, setBailItems] = useState<BailItem[]>([]);
  const [personalItems, setPersonalItems] = useState<PersonalItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);

  const [calcForm, setCalcForm] = useState({
    caseType: "",
    specializationId: "",
    stage: "",
    hours: "",
    baseAmount: "",
  });
  const [calcResult, setCalcResult] = useState<{
    ruleName: string;
    calculatedAmount: number;
    method: string;
    displayForClient: string;
  } | null>(null);
  const [calcError, setCalcError] = useState("");

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/financial-records", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/fee-rules", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/bail-guarantees", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/personal-guarantees", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/official-notifications", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/payments", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/legal-specializations", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([inv, rules, bail, personal, notif, pay, specList]) => {
        setInvoices(inv);
        setFeeRules(rules);
        setBailItems(bail);
        setPersonalItems(personal);
        setNotifications(notif);
        setPayments(pay);
        setSpecs(specList.map((s: Spec) => ({ id: s.id, name: s.name })));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const { seed, seeding, Toast } = useSeedDemo(loadAll);

  const runCalculator = async () => {
    setCalcError("");
    setCalcResult(null);
    const res = await fetch("/api/fee-calculator", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseType: calcForm.caseType || undefined,
        specializationId: calcForm.specializationId || undefined,
        stage: calcForm.stage || undefined,
        hours: calcForm.hours ? Number(calcForm.hours) : undefined,
        baseAmount: calcForm.baseAmount ? Number(calcForm.baseAmount) : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCalcError(data.error ?? "فشل الحساب");
      return;
    }
    setCalcResult(data);
  };

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid), 0);
  const totalBail = bailItems.reduce((s, b) => s + Number(b.amount), 0);

  if (!ready || !user) return null;

  const canWrite = canWriteRole(user.role);
  const isEmpty = !loading && invoices.length === 0 && feeRules.length === 0;

  return (
    <AppShell>
      {Toast}
      <div style={{ maxWidth: 1200 }}>
        <PageHeader
          icon="💰"
          title="المالية القانونية المتقدمة"
          subtitle="الفواتير، قواعد الأتعاب، الكفالات، الضمانات، الإشعارات الرسمية والمدفوعات"
          actions={
            <>
              {canWrite && <BtnPrimary onClick={seed}>➕ تحميل بيانات مالية</BtnPrimary>}
              {isEmpty && (
                <button type="button" onClick={seed} disabled={seeding} style={{ padding: "0.6rem 1.15rem", borderRadius: "12px", border: "1px solid #c3152a", background: "rgba(195,21,42,0.06)", color: "#c3152a", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
                  {seeding ? "⏳ جاري التحميل..." : "📦 بيانات تجريبية"}
                </button>
              )}
            </>
          }
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "إجمالي الفواتير", value: `${totalInvoiced.toLocaleString("ar-EG")} ج.م`, color: "#0a0a12" },
            { label: "المحصّل", value: `${totalPaid.toLocaleString("ar-EG")} ج.م`, color: "#22c55e" },
            { label: "المتبقي", value: `${(totalInvoiced - totalPaid).toLocaleString("ar-EG")} ج.م`, color: "#c3152a" },
            { label: "كفالات نشطة", value: `${totalBail.toLocaleString("ar-EG")} ج.م`, color: "#f59e0b" },
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
          <PageLoader />
        ) : isEmpty ? (
          <EmptyState icon="💰" title="لا توجد بيانات مالية" description="حمّل البيانات التجريبية لتظهر الفواتير وقواعد الأتعاب والكفالات" onSeed={seed} seeding={seeding} canWrite={canWrite} />
        ) : (
          <>
            {tab === "invoices" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["رقم الفاتورة", "الموكل", "النوع", "المبلغ", "المسدد", "التاريخ", "الحالة"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={tdStyle}>{inv.invoiceNo}</td>
                        <td style={tdStyle}>{inv.client}</td>
                        <td style={tdStyle}>{inv.type}</td>
                        <td style={tdStyle}>{Number(inv.amount).toLocaleString("ar-EG")} ج.م</td>
                        <td style={tdStyle}>{Number(inv.paid).toLocaleString("ar-EG")} ج.م</td>
                        <td style={tdStyle}>{inv.issueDate}</td>
                        <td style={{ ...tdStyle, color: inv.status.includes("مسدد") ? "#22c55e" : "#c3152a", fontWeight: 600 }}>
                          {inv.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invoices.length === 0 && <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>لا توجد فواتير</p>}
              </div>
            )}

            {tab === "fee-rules" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["القاعدة", "نوع القضية", "التخصص", "المرحلة", "ساعة", "ثابت", "نسبة", "الحالة"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feeRules.map((r) => (
                      <tr key={r.id}>
                        <td style={tdStyle}>{r.name}</td>
                        <td style={tdStyle}>{r.caseType}</td>
                        <td style={tdStyle}>{r.specialization}</td>
                        <td style={tdStyle}>{r.stage}</td>
                        <td style={tdStyle}>{r.hourlyRate || "—"}</td>
                        <td style={tdStyle}>{r.fixedAmount || "—"}</td>
                        <td style={tdStyle}>{r.percentRate ? `${r.percentRate}%` : "—"}</td>
                        <td style={{ ...tdStyle, color: r.active === "نشط" ? "#22c55e" : "#94a3b8" }}>{r.active}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {feeRules.length === 0 && <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>لا توجد قواعد أتعاب</p>}
              </div>
            )}

            {tab === "calculator" && (
              <div className="card-white" style={{ padding: "1.5rem", maxWidth: 520 }}>
                <h3 style={{ fontWeight: 800, marginBottom: "1rem", color: "#0a0a12" }}>حاسبة الأتعاب للعميل</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <input
                    placeholder="نوع القضية (مثال: تجاري)"
                    value={calcForm.caseType}
                    onChange={(e) => setCalcForm({ ...calcForm, caseType: e.target.value })}
                    style={inputStyle}
                  />
                  <select
                    value={calcForm.specializationId}
                    onChange={(e) => setCalcForm({ ...calcForm, specializationId: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">— التخصص —</option>
                    {specs.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    placeholder="المرحلة (ابتدائي / استئناف)"
                    value={calcForm.stage}
                    onChange={(e) => setCalcForm({ ...calcForm, stage: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    placeholder="عدد الساعات (اختياري)"
                    type="number"
                    value={calcForm.hours}
                    onChange={(e) => setCalcForm({ ...calcForm, hours: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    placeholder="المبلغ الأساسي للنسبة (اختياري)"
                    type="number"
                    value={calcForm.baseAmount}
                    onChange={(e) => setCalcForm({ ...calcForm, baseAmount: e.target.value })}
                    style={inputStyle}
                  />
                  <button type="button" onClick={runCalculator} style={btnStyle}>
                    احسب الأتعاب
                  </button>
                  {calcError && <p style={{ color: "#c3152a", fontSize: "0.85rem" }}>{calcError}</p>}
                  {calcResult && (
                    <div style={{ background: "#f8f9fb", borderRadius: "12px", padding: "1rem", marginTop: "0.5rem" }}>
                      <p style={{ fontWeight: 800, color: "#c3152a", fontSize: "1.1rem", marginBottom: "0.35rem" }}>
                        {calcResult.displayForClient}
                      </p>
                      <p style={{ fontSize: "0.82rem", color: "#64748b" }}>القاعدة: {calcResult.ruleName}</p>
                      <p style={{ fontSize: "0.82rem", color: "#64748b" }}>الطريقة: {calcResult.method}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "bail" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["القضية", "الموكل", "المبلغ", "المحكمة", "تاريخ الإيداع", "الاسترداد", "الحالة"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bailItems.map((b) => (
                      <tr key={b.id}>
                        <td style={tdStyle}>{b.caseRef}</td>
                        <td style={tdStyle}>{b.client}</td>
                        <td style={tdStyle}>{Number(b.amount).toLocaleString("ar-EG")} ج.م</td>
                        <td style={tdStyle}>{b.court}</td>
                        <td style={tdStyle}>{b.depositDate}</td>
                        <td style={tdStyle}>{b.refundDate}</td>
                        <td style={tdStyle}>{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bailItems.length === 0 && <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>لا توجد كفالات</p>}
              </div>
            )}

            {tab === "personal" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["القضية", "الموكل", "الضامن", "العلاقة", "الحالة"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {personalItems.map((g) => (
                      <tr key={g.id}>
                        <td style={tdStyle}>{g.caseRef}</td>
                        <td style={tdStyle}>{g.client}</td>
                        <td style={tdStyle}>{g.guarantor}</td>
                        <td style={tdStyle}>{g.relationship}</td>
                        <td style={tdStyle}>{g.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {personalItems.length === 0 && <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>لا توجد ضمانات شخصية</p>}
              </div>
            )}

            {tab === "notifications" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["النوع", "العنوان", "الجهة", "القضية", "الموعد", "الحالة"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n) => (
                      <tr key={n.id}>
                        <td style={tdStyle}>{n.type}</td>
                        <td style={tdStyle}>{n.title}</td>
                        <td style={tdStyle}>{n.entity}</td>
                        <td style={tdStyle}>{n.caseRef}</td>
                        <td style={tdStyle}>{n.dueDate}</td>
                        <td style={tdStyle}>{n.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {notifications.length === 0 && <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>لا توجد إشعارات</p>}
              </div>
            )}

            {tab === "payments" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["الفاتورة", "الموكل", "المبلغ", "طريقة الدفع", "التاريخ"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td style={tdStyle}>{p.invoiceNo}</td>
                        <td style={tdStyle}>{p.client}</td>
                        <td style={tdStyle}>{Number(p.amount).toLocaleString("ar-EG")} ج.م</td>
                        <td style={tdStyle}>{p.method}</td>
                        <td style={tdStyle}>{p.paidAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>لا توجد مدفوعات</p>}
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
  marginTop: "0.25rem",
};
