import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const item = await prisma.case.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.case.findUnique({ where: { id }, select: { clientId: true } });
      if (!current) {
        return null;
      }

      let nextClientId: string | null | undefined;
      if (body.client !== undefined) {
        const clientName = String(body.client).trim();
        const client = clientName
          ? await tx.client.findFirst({ where: { name: clientName }, select: { id: true } })
          : null;
        nextClientId = client?.id ?? null;
      }

      const item = await tx.case.update({
        where: { id },
        data: {
          clientId: nextClientId,
          clientName: body.client !== undefined ? String(body.client).trim() : undefined,
          type: body.type !== undefined ? String(body.type) : undefined,
          court: body.court !== undefined ? String(body.court) : undefined,
          status: body.status !== undefined ? String(body.status) : undefined,
          nextDate: body.nextDate !== undefined ? String(body.nextDate) || null : undefined,
          fees: body.fees !== undefined ? String(body.fees) || null : undefined,
          notes: body.notes !== undefined ? String(body.notes) || null : undefined,
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
  } catch (error) {
    return handleApiError(error, "فشل تعديل القضية");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const current = await tx.case.findUnique({ where: { id }, select: { clientId: true } });
      if (!current) return false;
      await tx.case.delete({ where: { id } });
      if (current.clientId) {
        const casesCount = await tx.case.count({ where: { clientId: current.clientId } });
        await tx.client.update({
          where: { id: current.clientId },
          data: { casesCount },
        });
      }
      return true;
    });
    if (!deleted) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "فشل حذف القضية");
  }
}
