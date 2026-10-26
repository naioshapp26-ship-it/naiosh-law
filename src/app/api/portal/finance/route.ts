import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { loadPortalInvoices } from "@/lib/client-portal-data";

export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const invoices = await loadPortalInvoices(session);
  const dueAmount = invoices.reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0);
  const paidAmount = invoices.reduce((s, i) => s + i.paid, 0);
  return NextResponse.json({
    invoices,
    summary: { dueAmount, paidAmount, count: invoices.length },
    paymentsEnabled: false,
    note: "عرض الفواتير وحالات السداد فقط — لا بوابة تحصيل إلكتروني في هذه المرحلة.",
  });
}
