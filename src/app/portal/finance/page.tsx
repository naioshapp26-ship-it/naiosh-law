"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import type { PortalInvoice } from "@/lib/client-portal";

export default function PortalFinancePage() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [summary, setSummary] = useState({ dueAmount: 0, paidAmount: 0, count: 0 });
  const [note, setNote] = useState("");
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/finance", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/portal/profile", { credentials: "include" }).then((r) => r.json()),
    ]).then(([f, p]) => {
      setInvoices(f.invoices || []);
      setSummary(f.summary || { dueAmount: 0, paidAmount: 0, count: 0 });
      setNote(f.note || "");
      setDemo(Boolean(p.profile?.isDemo));
    });
  }, []);

  return (
    <PortalShell title="المالية والمعاملات" demoBanner={demo}>
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
        <p style={{ color: "#526071", fontWeight: 600 }}>{note}</p>
        {invoices.length === 0 ? (
          <div className="portal-empty">لا فواتير مرتبطة بحسابك حالياً.</div>
        ) : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>المدفوع</th>
                <th>الحالة</th>
                <th>المرجع</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.invoiceNo}</td>
                  <td>{i.type}</td>
                  <td>{i.amount.toLocaleString("ar-EG")}</td>
                  <td>{i.paid.toLocaleString("ar-EG")}</td>
                  <td>
                    <span className="portal-badge">{i.status}</span>
                  </td>
                  <td>{i.caseRef || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ marginTop: "1rem", fontWeight: 700, color: "#7a6230" }}>
          لا توجد بوابة دفع إلكتروني مفعّلة في هذه المرحلة — الفواتير التجريبية غير قابلة للتحصيل.
        </p>
      </section>
    </PortalShell>
  );
}
