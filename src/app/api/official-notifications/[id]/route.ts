import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import type { NotificationType } from "@/generated/prisma/client";
import { resolveRequiredCaseFromBody } from "@/lib/case-identity-server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.officialNotification.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let caseRef = existing.caseRef;
  if (
    body.caseId !== undefined ||
    body.caseNo !== undefined ||
    body.caseRef !== undefined
  ) {
    const resolved = await resolveRequiredCaseFromBody(body as Record<string, unknown>, {
      required: true,
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    caseRef = resolved.case!.caseNo;
  }

  const updated = await prisma.officialNotification.update({
    where: { id },
    data: {
      type: body.type !== undefined ? (body.type as NotificationType) : undefined,
      title: body.title !== undefined ? String(body.title) : undefined,
      entityName:
        body.entity !== undefined
          ? String(body.entity)
          : body.entityName !== undefined
            ? String(body.entityName)
            : undefined,
      caseRef,
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
