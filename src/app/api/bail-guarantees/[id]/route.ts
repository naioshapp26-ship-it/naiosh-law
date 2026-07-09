import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.bailGuarantee.update({
    where: { id },
    data: {
      caseRef: body.caseRef !== undefined ? String(body.caseRef) : undefined,
      clientName: body.client !== undefined ? String(body.client) : undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      court: body.court !== undefined ? String(body.court) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      depositDate: body.depositDate !== undefined ? String(body.depositDate) : undefined,
      refundDate: body.refundDate !== undefined ? String(body.refundDate) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.bailGuarantee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
