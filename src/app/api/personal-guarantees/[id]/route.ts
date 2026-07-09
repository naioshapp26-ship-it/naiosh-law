import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.personalGuarantee.update({
    where: { id },
    data: {
      caseRef: body.caseRef !== undefined ? String(body.caseRef) : undefined,
      clientName: body.client !== undefined ? String(body.client) : undefined,
      guarantorName: body.guarantor !== undefined ? String(body.guarantor) : undefined,
      relationship: body.relationship !== undefined ? String(body.relationship) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      documents: body.documents !== undefined ? String(body.documents) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.personalGuarantee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
