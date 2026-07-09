import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const cases = await prisma.case.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, branch: true, specialization: true },
  });

  return NextResponse.json(
    cases.map((c) => ({
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
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const created = await prisma.$transaction(async (tx) => {
    const count = await tx.case.count();
    const caseNo = body.caseNo ?? `#${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const clientName = String(body.client ?? "").trim();
    const client = clientName
      ? await tx.client.findFirst({ where: { name: clientName }, select: { id: true } })
      : null;

    const item = await tx.case.create({
      data: {
        caseNo: String(caseNo),
        clientId: client?.id,
        clientName,
        type: String(body.type ?? "مدني"),
        court: String(body.court ?? ""),
        status: String(body.status ?? "نشطة"),
        nextDate: body.nextDate ? String(body.nextDate) : null,
        fees: body.fees != null ? String(body.fees) : null,
        notes: body.notes ? String(body.notes) : null,
      },
    });

    if (client) {
      const casesCount = await tx.case.count({ where: { clientId: client.id } });
      await tx.client.update({
        where: { id: client.id },
        data: { casesCount },
      });
    }

    return item;
  });

  return NextResponse.json({ id: created.id, caseNo: created.caseNo }, { status: 201 });
}
