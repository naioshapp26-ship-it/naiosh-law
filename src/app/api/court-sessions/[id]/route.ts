import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, readJsonObject, requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const caseNo = body.caseNo !== undefined ? String(body.caseNo).trim() : undefined;
  const relatedCase = caseNo
    ? await prisma.case.findUnique({ where: { caseNo }, select: { id: true, clientName: true } })
    : null;

  try {
    const updated = await prisma.courtSession.update({
      where: { id },
      data: {
        caseId: caseNo !== undefined ? relatedCase?.id ?? null : undefined,
        caseNo: caseNo !== undefined ? caseNo || null : undefined,
        client: body.client !== undefined ? String(body.client) || null : relatedCase?.clientName,
        court: body.court !== undefined ? String(body.court) : undefined,
        room: body.room !== undefined ? String(body.room) || null : undefined,
        date: body.date !== undefined ? String(body.date) : undefined,
        time: body.time !== undefined ? String(body.time) || null : undefined,
        type: body.type !== undefined ? String(body.type) : undefined,
        status: body.status !== undefined ? String(body.status) : undefined,
        lawyer: body.lawyer !== undefined ? String(body.lawyer) || null : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "فشل تعديل الجلسة");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  try {
    await prisma.courtSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "فشل حذف الجلسة");
  }
}
