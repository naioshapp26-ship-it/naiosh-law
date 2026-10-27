import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { persistCustomFieldsFromBody } from "@/lib/page-settings/record-custom-api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.courtSession.update({
    where: { id },
    data: {
      caseNo: body.caseNo !== undefined ? String(body.caseNo) : undefined,
      client: body.client !== undefined ? String(body.client) : undefined,
      court: body.court !== undefined ? String(body.court) : undefined,
      room: body.room !== undefined ? String(body.room) : undefined,
      date: body.date !== undefined ? String(body.date) : undefined,
      time: body.time !== undefined ? String(body.time) : undefined,
      type: body.type !== undefined ? String(body.type) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      lawyer: body.lawyer !== undefined ? String(body.lawyer) : undefined,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "court-sessions",
    sourceId: id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.courtSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
