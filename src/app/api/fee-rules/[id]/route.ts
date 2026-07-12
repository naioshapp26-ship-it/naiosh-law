import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.feeRule.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : undefined,
      caseType: body.caseType !== undefined ? String(body.caseType) : undefined,
      stage: body.stage !== undefined ? String(body.stage) : undefined,
      hourlyRate: body.hourlyRate !== undefined ? Number(body.hourlyRate) : undefined,
      fixedAmount: body.fixedAmount !== undefined ? Number(body.fixedAmount) : undefined,
      percentRate: body.percentRate !== undefined ? Number(body.percentRate) : undefined,
      active: body.active !== undefined ? Boolean(body.active) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.feeRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
