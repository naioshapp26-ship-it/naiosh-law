import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requireWrite, withApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const caseNo = body.caseNo !== undefined ? nullableString(body.caseNo) : undefined;

  return withApiError(async () => {
    const relatedCase = caseNo
      ? await prisma.case.findUnique({ where: { caseNo }, select: { id: true, clientName: true } })
      : null;

    const updated = await prisma.courtSession.update({
      where: { id },
      data: {
        caseId: caseNo !== undefined ? relatedCase?.id ?? null : undefined,
        caseNo,
        client: body.client !== undefined ? nullableString(body.client) : relatedCase?.clientName,
        court: body.court !== undefined ? String(body.court).trim() : undefined,
        room: body.room !== undefined ? nullableString(body.room) : undefined,
        date: body.date !== undefined ? String(body.date).trim() : undefined,
        time: body.time !== undefined ? nullableString(body.time) : undefined,
        type: body.type !== undefined ? String(body.type).trim() : undefined,
        status: body.status !== undefined ? String(body.status).trim() : undefined,
        lawyer: body.lawyer !== undefined ? nullableString(body.lawyer) : undefined,
      },
    });
    return NextResponse.json(updated);
  }, "Update court session");
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  return withApiError(async () => {
    await prisma.courtSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }, "Delete court session");
}
