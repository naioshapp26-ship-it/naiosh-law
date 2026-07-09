import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.financialRecord.update({
    where: { id },
    data: {
      clientName: body.client !== undefined ? String(body.client) : undefined,
      type: body.type !== undefined ? String(body.type) : undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      paid: body.paid !== undefined ? Number(body.paid) : undefined,
      issueDate: body.issueDate !== undefined ? String(body.issueDate) : undefined,
      dueDate: body.dueDate !== undefined ? String(body.dueDate) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.financialRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
