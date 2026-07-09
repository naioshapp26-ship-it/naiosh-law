import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  return withApiError(async () => {
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
  }, "List cases");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const clientName = requiredString(body, { field: "client", label: "اسم الموكل" });
  if (clientName.error) return clientName.error;
  const court = requiredString(body, { field: "court", label: "المحكمة" });
  if (court.error) return court.error;

  return withApiError(async () => {
    const created = await prisma.$transaction(async (tx) => {
      const count = await tx.case.count();
      const caseNo = nullableString(body.caseNo) ?? `#${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
      const client = await tx.client.findFirst({ where: { name: clientName.value }, select: { id: true } });

      const item = await tx.case.create({
        data: {
          caseNo,
          clientId: client?.id,
          clientName: clientName.value,
          type: nullableString(body.type) ?? "مدني",
          court: court.value,
          status: nullableString(body.status) ?? "نشطة",
          nextDate: nullableString(body.nextDate),
          fees: nullableString(body.fees),
          notes: nullableString(body.notes),
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
  }, "Create case");
}
