"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalEmptyState, PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalJson } from "@/lib/portal-fetch";
import type { PortalInvoice } from "@/lib/client-portal";

export default function PortalFinancePage() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [summary, setSummary] = useState({ dueAmount: 0, paidAmount: 0, count: 0 });
  const [note, setNote] = useState("");
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("الكل");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [f, p] = await Promise.all([
      portalJson<{
        invoices?: PortalInvoice[];
        summary?: { dueAmount: number; paidAmount: number; count: number };
        note?: string;
      }>("/api/portal/finance"),
      portalJson<{ profile?: { isDemo?: boolean } }>("/api/portal/profile"),
    ]);
    if (!f.ok) {
      setError(f.error);
      setInvoices([]);
      setLoading(false);
      return;
    }
    setInvoices(f.data.invoices || []);
    setSummary(f.data.summary || { dueAmount: 0, paidAmount: 0, count: 0 });
    setNote(f.data.note || "");
    setDemo(Boolean(p.ok && p.data.profile?.isDemo));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return invoices.filter((i) => {
      if (status !== "الكل" && !i.status.includes(status)) return false;
      if (!needle) return true;
      return [i.invoiceNo, i.type, i.status, i.caseRef || "", i.notes || ""].join(" ").toLowerCase().includes(needle);
    });
  }, [invoices, q, status]);

  return (
    <PortalShell title="المالية والمعاملات" demoBanner={demo}>
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}

      <div className="portal-grid">
        <article className="portal-card portal-kpi">
          <strong>{summary.dueAmount.toLocaleString("ar-EG")} ر.س</strong>
          <span>المستحق</span>
        </article>
        <article className="portal-card portal-kpi">
          <strong>{summary.paidAmount.toLocaleString("ar-EG")} ر.س</strong>
          <span>المدفوع المسجّل</span>
        </article>
        <article className="portal-card portal-kpi">
          <strong>{summary.count}</strong>
          <span>عدد الفواتير</span>
        </article>
      </div>

      <section className="portal-card">
        <h2>الفواتير وسجل المعاملات</h2>
        {note ? <p style={{ color: "#526071", fontWeight: 600 }}>{note}</p> : null}
        <div className="portal-grid" style={{ gridTemplateColumns: "1.4fr 0.8fr" }}>
          <label>
            بحث
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="رقم فاتورة أو مرجع…" />
          </label>
          <label>
            الحالة
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>الكل</option>
              <option>غير مسدد</option>
              <option>مسدد</option>
              <option>جزئي</option>
            </select>
          </label>
        </div>

        {loading ? <PortalLoadingCard /> : null}
        {!loading && filtered.length === 0 ? (
          <PortalEmptyState
            title={invoices.length ? "لا نتائج" : "لا فواتير مرتبطة بحسابك حالياً"}
            description="عند إصدار فاتورة مرتبطة بحسابك من الإدارة ستظهر هنا مع تفاصيل المبالغ."
            actionHref="/portal/messages"
            actionLabel="مراسلة المكتب بخصوص فاتورة"
          />
        ) : null}

        {!loading && filtered.length > 0 ? (
          <table className="portal-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>المدفوع</th>
                <th>الحالة</th>
                <th>المرجع</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <Fragment key={i.id}>
                  <tr>
                    <td>{i.invoiceNo}</td>
                    <td>{i.type}</td>
                    <td>{i.amount.toLocaleString("ar-EG")}</td>
                    <td>{i.paid.toLocaleString("ar-EG")}</td>
                    <td>
                      <span className="portal-badge">{i.status}</span>
                    </td>
                    <td>{i.caseRef || "—"}</td>
                    <td>
                      <button type="button" className="portal-btn ghost" onClick={() => setOpenId(openId === i.id ? null : i.id)}>
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                  {openId === i.id ? (
                    <tr>
                      <td colSpan={7}>
                        <div style={{ padding: "0.5rem 0", color: "#526071", fontWeight: 600 }}>
                          تاريخ الإصدار: {i.issueDate} · الاستحقاق: {i.dueDate || "—"}
                          <br />
                          المتبقي: {Math.max(0, i.amount - i.paid).toLocaleString("ar-EG")} ر.س
                          <br />
                          ملاحظات: {i.notes || "—"}
                          <br />
                          {i.collectible
                            ? "هذه فاتورة حقيقية مسجّلة — الدفع الإلكتروني غير مفعّل بعد. راجع المكتب لتسوية السداد."
                            : "فاتورة للعرض فقط / غير قابلة للتحصيل الإلكتروني."}
                          <div className="portal-actions" style={{ marginTop: "0.65rem" }}>
                            <Link className="portal-btn primary" href="/portal/messages">
                              استفسار عن الفاتورة
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : null}

        <p style={{ marginTop: "1rem", fontWeight: 700, color: "#7a6230" }}>
          لا توجد بوابة دفع إلكتروني مفعّلة في هذه المرحلة — لا يتم تحصيل أي مبلغ عبر البوابة.
        </p>
      </section>
    </PortalShell>
  );
}
