import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  return withApiError(async () => {
    const item = await prisma.case.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    return NextResponse.json(item);
  }, "Get case");
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  return withApiError(async () => {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.case.findUnique({ where: { id }, select: { clientId: true } });
      if (!current) {
        return null;
      }

      let nextClientId: string | null | undefined;
      let nextClientName: string | undefined;
      if (body.client !== undefined) {
        nextClientName = nullableString(body.client) ?? "";
        const client = nextClientName
          ? await tx.client.findFirst({ where: { name: nextClientName }, select: { id: true } })
          : null;
        nextClientId = client?.id ?? null;
      }

      const item = await tx.case.update({
        where: { id },
        data: {
          clientId: nextClientId,
          clientName: nextClientName,
          type: body.type !== undefined ? String(body.type).trim() : undefined,
          court: body.court !== undefined ? String(body.court).trim() : undefined,
          status: body.status !== undefined ? String(body.status).trim() : undefined,
          nextDate: body.nextDate !== undefined ? nullableString(body.nextDate) : undefined,
          fees: body.fees !== undefined ? nullableString(body.fees) : undefined,
          notes: body.notes !== undefined ? nullableString(body.notes) : undefined,
        },
      });

      if (nextClientId !== undefined && nextClientId !== current.clientId) {
        if (current.clientId) {
          const currentClientCaseCount = await tx.case.count({ where: { clientId: current.clientId } });
          await tx.client.update({
            where: { id: current.clientId },
            data: { casesCount: currentClientCaseCount },
          });
        }
        if (nextClientId) {
          const nextClientCaseCount = await tx.case.count({ where: { clientId: nextClientId } });
          await tx.client.update({
            where: { id: nextClientId },
            data: { casesCount: nextClientCaseCount },
          });
        }
      }

      return item;
    });
    if (!updated) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    return NextResponse.json(updated);
  }, "Update case");
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  return withApiError(async () => {
    await prisma.$transaction(async (tx) => {
      const current = await tx.case.findUnique({ where: { id }, select: { clientId: true } });
      await tx.case.delete({ where: { id } });
      if (current?.clientId) {
        const casesCount = await tx.case.count({ where: { clientId: current.clientId } });
        await tx.client.update({
          where: { id: current.clientId },
          data: { casesCount },
        });
      }
    });
    return NextResponse.json({ ok: true });
  }, "Delete case");
}
