import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.circularInstruction.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      issuer: body.issuer !== undefined ? String(body.issuer) : undefined,
      summary: body.summary !== undefined ? String(body.summary) : undefined,
      content: body.content !== undefined ? String(body.content) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      effectiveDate: body.effectiveDate !== undefined ? String(body.effectiveDate) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.circularInstruction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
