import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { PaymentMethod } from "@/generated/prisma/client";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const records = await prisma.financialRecord.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    records.map((r) => ({
      id: r.id,
      invoiceNo: r.invoiceNo,
      client: r.clientName,
      type: r.type,
      amount: String(r.amount),
      paid: String(r.paid),
      issueDate: r.issueDate,
      status: r.status,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const count = await prisma.financialRecord.count();
  const invoiceNo = body.invoiceNo ?? `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const created = await prisma.financialRecord.create({
    data: {
      invoiceNo,
      clientName: String(body.client ?? body.clientName ?? ""),
      type: String(body.type ?? "رسوم قضية"),
      amount: Number(body.amount ?? 0),
      paid: Number(body.paid ?? 0),
      issueDate: String(body.issueDate ?? new Date().toISOString().slice(0, 10)),
      dueDate: body.dueDate ? String(body.dueDate) : null,
      status: String(body.status ?? "غير مسدد"),
      paymentMethod: body.paymentMethod as PaymentMethod | undefined,
      caseRef: body.caseRef ? String(body.caseRef) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
