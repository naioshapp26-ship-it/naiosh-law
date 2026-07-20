import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import type { PaymentMethod } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      method: body.method !== undefined ? (body.method as PaymentMethod) : undefined,
      reference: body.reference !== undefined ? String(body.reference) : undefined,
      paidAt: body.paidAt !== undefined ? String(body.paidAt) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
      recordId: body.recordId !== undefined ? (body.recordId ? String(body.recordId) : null) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.payment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
