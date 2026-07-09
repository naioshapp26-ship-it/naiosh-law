import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { PaymentMethod } from "@/generated/prisma/client";

const methodLabels: Record<PaymentMethod, string> = {
  cash: "نقدي",
  transfer: "تحويل بنكي",
  check: "شيك",
  payment_gateway: "بوابة دفع",
};

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { record: true },
  });

  return NextResponse.json(
    payments.map((p) => ({
      id: p.id,
      invoiceNo: p.record?.invoiceNo ?? "—",
      client: p.record?.clientName ?? "—",
      amount: String(p.amount),
      method: methodLabels[p.method] ?? p.method,
      reference: p.reference ?? "—",
      paidAt: p.paidAt,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const recordId = body.recordId ? String(body.recordId) : null;
  const amount = Number(body.amount ?? 0);

  const payment = await prisma.payment.create({
    data: {
      recordId,
      amount,
      method: (body.method as PaymentMethod) ?? "cash",
      reference: body.reference ? String(body.reference) : null,
      paidAt: String(body.paidAt ?? new Date().toISOString().slice(0, 10)),
      notes: body.notes ? String(body.notes) : null,
    },
  });

  if (recordId) {
    const record = await prisma.financialRecord.findUnique({ where: { id: recordId } });
    if (record) {
      const newPaid = record.paid + amount;
      const status =
        newPaid >= record.amount ? "مسدد بالكامل" : newPaid > 0 ? "مسدد جزئياً" : "غير مسدد";
      await prisma.financialRecord.update({
        where: { id: recordId },
        data: { paid: newPaid, status },
      });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}
