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
import { formatCurrency, formatNumber } from "@/lib/format";
import type { FormField } from "@/data/module-configs";

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

const tabs: { key: Tab; label: string; addLabel?: string }[] = [
  { key: "invoices", label: "الفواتير", addLabel: "إضافة فاتورة" },
  { key: "fee-rules", label: "قواعد الأتعاب", addLabel: "إضافة قاعدة أتعاب" },
  { key: "calculator", label: "حاسبة الأتعاب" },
  { key: "bail", label: "كفالات مالية", addLabel: "إضافة كفالة" },
  { key: "personal", label: "ضمانات شخصية", addLabel: "إضافة ضمان شخصي" },
  { key: "notifications", label: "إشعارات رسمية", addLabel: "إضافة إشعار رسمي" },
  { key: "payments", label: "المدفوعات", addLabel: "إضافة دفعة" },
];

const NOTIFICATION_TYPE_MAP: Record<string, string> = {
  "استدعاء محكمة": "court_summons",
  "موعد كفالة": "bail_deadline",
  "تقديم مستند": "document_submission",
  "تبليغ حكم": "judgment_delivery",
  أخرى: "other",
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  "نقداً": "cash",
  تحويل: "transfer",
  شيك: "check",
  "بوابة دفع": "payment_gateway",
};

const invoiceFields: FormField[] = [
  { key: "client", label: "الموكل", type: "text", required: true },
  {
    key: "type",
    label: "النوع",
    type: "select",
    options: ["رسوم قضية", "رسوم استشارة", "رسوم تحكيم", "رسوم سنوية", "مصروفات قضائية"],
  },
  { key: "amount", label: "المبلغ", type: "number", required: true },
  { key: "paid", label: "المسدد", type: "number" },
  { key: "issueDate", label: "تاريخ الإصدار", type: "date" },
  {
    key: "status",
    label: "الحالة",
    type: "select",
    options: ["غير مسدد", "جزئي", "مسدد"],
  },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const feeRuleFields: FormField[] = [
  { key: "name", label: "اسم القاعدة", type: "text", required: true },
  { key: "caseType", label: "نوع القضية", type: "text" },
  { key: "stage", label: "المرحلة", type: "text" },
  { key: "hourlyRate", label: "الأجر بالساعة", type: "number" },
  { key: "fixedAmount", label: "مبلغ ثابت", type: "number" },
  { key: "percentRate", label: "نسبة مئوية", type: "number" },
  { key: "minAmount", label: "الحد الأدنى", type: "number" },
  { key: "maxAmount", label: "الحد الأقصى", type: "number" },
  { key: "description", label: "الوصف", type: "textarea" },
];

const bailFields: FormField[] = [
  { key: "caseRef", label: "مرجع القضية", type: "text" },
  { key: "client", label: "الموكل", type: "text" },
  { key: "amount", label: "المبلغ", type: "number" },
  { key: "court", label: "المحكمة", type: "text" },
  { key: "depositDate", label: "تاريخ الإيداع", type: "date" },
  {
    key: "status",
    label: "الحالة",
    type: "select",
    options: ["نشط", "مسترد", "موقوف"],
  },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const personalFields: FormField[] = [
  { key: "caseRef", label: "مرجع القضية", type: "text" },
  { key: "client", label: "الموكل", type: "text" },
  { key: "guarantor", label: "الضامن", type: "text" },
  { key: "relationship", label: "العلاقة", type: "text" },
  {
    key: "status",
    label: "الحالة",
    type: "select",
    options: ["ساري", "منتهي"],
  },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const notificationFields: FormField[] = [
  { key: "title", label: "العنوان", type: "text", required: true },
  {
    key: "type",
    label: "النوع",
    type: "select",
    options: ["استدعاء محكمة", "موعد كفالة", "تقديم مستند", "تبليغ حكم", "أخرى"],
  },
  { key: "entity", label: "الجهة", type: "text" },
  { key: "caseRef", label: "مرجع القضية", type: "text" },
  { key: "dueDate", label: "الموعد", type: "date" },
  {
    key: "status",
    label: "الحالة",
    type: "select",
    options: ["قيد المتابعة", "مكتمل", "متأخر"],
  },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const paymentFields: FormField[] = [
  { key: "amount", label: "المبلغ", type: "number", required: true },
  {
    key: "method",
    label: "طريقة الدفع",
    type: "select",
    options: ["نقداً", "تحويل", "شيك", "بوابة دفع"],
  },
  { key: "reference", label: "المرجع", type: "text" },
  { key: "paidAt", label: "تاريخ الدفع", type: "date" },
  { key: "notes", label: "ملاحظات", type: "textarea" },
  { key: "recordId", label: "معرّف الفاتورة", type: "text", placeholder: "id فاتورة (اختياري)" },
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

function numOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function LegalFinancePage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("invoices");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

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
  const { show, Toast: ActionToast } = useToast();

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
        setInvoices(Array.isArray(inv) ? inv : []);
        setFeeRules(Array.isArray(rules) ? rules : []);
        setBailItems(Array.isArray(bail) ? bail : []);
        setPersonalItems(Array.isArray(personal) ? personal : []);
        setNotifications(Array.isArray(notif) ? notif : []);
        setPayments(Array.isArray(pay) ? pay : []);
        setSpecs(
          Array.isArray(specList)
            ? specList.map((s: Spec) => ({ id: s.id, name: s.name }))
            : []
        );
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

  const activeTab = tabs.find((t) => t.key === tab)!;
  const canAdd = Boolean(activeTab.addLabel);

  const formFields =
    tab === "invoices"
      ? invoiceFields
      : tab === "fee-rules"
        ? feeRuleFields
        : tab === "bail"
          ? bailFields
          : tab === "personal"
            ? personalFields
            : tab === "notifications"
              ? notificationFields
              : paymentFields;

  const handleAdd = async (data: Record<string, unknown>) => {
    const endpoint =
      tab === "invoices"
        ? "/api/financial-records"
        : tab === "fee-rules"
          ? "/api/fee-rules"
          : tab === "bail"
            ? "/api/bail-guarantees"
            : tab === "personal"
              ? "/api/personal-guarantees"
              : tab === "notifications"
                ? "/api/official-notifications"
                : "/api/payments";

    const payload =
      tab === "invoices"
        ? {
            client: data.client,
            type: data.type || "رسوم قضية",
            amount: Number(data.amount ?? 0),
            paid: Number(data.paid ?? 0),
            issueDate: data.issueDate || undefined,
            status: data.status || "غير مسدد",
            notes: data.notes || undefined,
          }
        : tab === "fee-rules"
          ? {
              name: data.name,
              caseType: data.caseType || undefined,
              stage: data.stage || undefined,
              hourlyRate: numOrNull(data.hourlyRate),
              fixedAmount: numOrNull(data.fixedAmount),
              percentRate: numOrNull(data.percentRate),
              minAmount: numOrNull(data.minAmount),
              maxAmount: numOrNull(data.maxAmount),
              description: data.description || undefined,
            }
          : tab === "bail"
            ? {
                caseRef: data.caseRef,
                client: data.client,
                amount: Number(data.amount ?? 0),
                court: data.court,
                depositDate: data.depositDate,
                status: data.status || "نشط",
                notes: data.notes || undefined,
              }
            : tab === "personal"
              ? {
                  caseRef: data.caseRef,
                  client: data.client,
                  guarantor: data.guarantor,
                  relationship: data.relationship || undefined,
                  status: data.status || "ساري",
                  notes: data.notes || undefined,
                }
              : tab === "notifications"
                ? {
                    title: data.title,
                    type: NOTIFICATION_TYPE_MAP[String(data.type)] ?? "other",
                    entity: data.entity,
                    caseRef: data.caseRef || undefined,
                    dueDate: data.dueDate || undefined,
                    status: data.status || "قيد المتابعة",
                    notes: data.notes || undefined,
                  }
                : {
                    amount: Number(data.amount ?? 0),
                    method: PAYMENT_METHOD_MAP[String(data.method)] ?? "cash",
                    reference: data.reference || undefined,
                    paidAt: data.paidAt || undefined,
                    notes: data.notes || undefined,
                    recordId: data.recordId ? String(data.recordId) : undefined,
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

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid), 0);
  const totalBail = bailItems.reduce((s, b) => s + Number(b.amount), 0);

  if (!ready || !user) return null;

  const canWrite = canWriteRole(user.role);
  const isEmpty = !loading && invoices.length === 0 && feeRules.length === 0;

  return (
    <AppShell>
      {Toast}
      {ActionToast}
      <div className="erp-page" style={{ width: "100%" }}>
        <PageHeader
          icon="💰"
          title="المالية القانونية المتقدمة"
          subtitle="الفواتير، قواعد الأتعاب، الكفالات، الضمانات، الإشعارات الرسمية والمدفوعات"
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "إجمالي الفواتير", value: formatCurrency(totalInvoiced), color: "#0a0a12" },
            { label: "المحصّل", value: formatCurrency(totalPaid), color: "#22c55e" },
            { label: "المتبقي", value: formatCurrency(totalInvoiced - totalPaid), color: "#c3152a" },
            { label: "كفالات نشطة", value: formatCurrency(totalBail), color: "#f59e0b" },
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
          <EmptyState
            icon="💰"
            title="لا توجد بيانات مالية"
            description="أضف فاتورة أو قاعدة أتعاب، أو حمّل البيانات التجريبية"
            onSeed={seed}
            onAdd={canWrite && canAdd ? () => setAddOpen(true) : undefined}
            seeding={seeding}
            canWrite={canWrite}
          />
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
                        <td style={tdStyle}>{formatCurrency(inv.amount)}</td>
                        <td style={tdStyle}>{formatCurrency(inv.paid)}</td>
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
                        <td style={tdStyle}>{r.hourlyRate ? formatCurrency(r.hourlyRate) : "—"}</td>
                        <td style={tdStyle}>{r.fixedAmount ? formatCurrency(r.fixedAmount) : "—"}</td>
                        <td style={tdStyle}>{r.percentRate ? `${formatNumber(r.percentRate)}%` : "—"}</td>
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
                        <td style={tdStyle}>{formatCurrency(b.amount)}</td>
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
                        <td style={tdStyle}>{formatCurrency(p.amount)}</td>
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
