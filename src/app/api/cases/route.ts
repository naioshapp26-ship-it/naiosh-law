import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const cases = await prisma.case.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, branch: true, specialization: true },
  });

  const base = cases.map((c) => ({
    id: c.id,
    caseNo: c.caseNo,
    client: c.clientName,
    type: c.type,
    court: c.court,
    status: c.status,
    nextDate: c.nextDate ?? "—",
    fees: c.fees ?? "0",
    branch: c.branch?.name,
    specialization: c.specialization?.name,
  }));

  const withCustom = await attachCustomValuesToRows("case-management", base);
  void session;
  return NextResponse.json(withCustom);
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  const body = await request.json();
  const count = await prisma.case.count();
  const caseNo = body.caseNo ?? `#${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const clientId = body.clientId ? String(body.clientId) : null;
  let clientName = String(body.client ?? body.clientName ?? "");
  if (clientId) {
    const linked = await prisma.client.findUnique({ where: { id: clientId } });
    if (!linked) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    if (!clientName) clientName = linked.name;
    await prisma.client.update({
      where: { id: clientId },
      data: { casesCount: { increment: 1 } },
    });
  }

  const created = await prisma.case.create({
    data: {
      caseNo,
      clientId,
      clientName,
      type: String(body.type ?? "مدني"),
      court: String(body.court ?? ""),
      status: String(body.status ?? "نشطة"),
      nextDate: body.nextDate ? String(body.nextDate) : null,
      fees: body.fees != null ? String(body.fees) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "case-management",
    sourceId: created.id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json({ id: created.id, caseNo: created.caseNo, clientId: created.clientId }, { status: 201 });
}
