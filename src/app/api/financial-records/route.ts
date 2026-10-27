import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { PaymentMethod } from "@/generated/prisma/client";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const records = await prisma.financialRecord.findMany({ orderBy: { createdAt: "desc" } });
  const base = records.map((r) => ({
    id: r.id,
    invoiceNo: r.invoiceNo,
    client: r.clientName,
    type: r.type,
    amount: String(r.amount),
    paid: String(r.paid),
    issueDate: r.issueDate,
    status: r.status,
  }));
  return NextResponse.json(await attachCustomValuesToRows("legal-accounting", base));
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const count = await prisma.financialRecord.count();
  const invoiceNo = body.invoiceNo ?? `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const clientId = body.clientId ? String(body.clientId) : null;
  let clientName = String(body.client ?? body.clientName ?? "");
  if (clientId) {
    const linked = await prisma.client.findUnique({ where: { id: clientId } });
    if (!linked) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    if (!clientName) clientName = linked.name;
  }

  const created = await prisma.financialRecord.create({
    data: {
      invoiceNo,
      clientId,
      clientName,
      type: String(body.type ?? "رسوم قضية"),
      amount: Number(body.amount ?? 0),
      paid: Number(body.paid ?? 0),
      issueDate: String(body.issueDate ?? new Date().toISOString().slice(0, 10)),
      dueDate: body.dueDate ? String(body.dueDate) : null,
      status: String(body.status ?? "غير مسدد"),
      paymentMethod: body.paymentMethod as PaymentMethod | undefined,
      caseRef: body.caseRef ? String(body.caseRef) : null,
      notes: body.notes ? String(body.notes) : null,
      isDemo: false,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "legal-accounting",
    sourceId: created.id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json({ id: created.id, clientId: created.clientId }, { status: 201 });
}
