import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import type { NotificationType } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.officialNotification.update({
    where: { id },
    data: {
      type: body.type !== undefined ? (body.type as NotificationType) : undefined,
      title: body.title !== undefined ? String(body.title) : undefined,
      entityName: body.entity !== undefined ? String(body.entity) : undefined,
      caseRef: body.caseRef !== undefined ? String(body.caseRef) : undefined,
      dueDate: body.dueDate !== undefined ? String(body.dueDate) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      deliveryMethod: body.deliveryMethod !== undefined ? String(body.deliveryMethod) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.officialNotification.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
