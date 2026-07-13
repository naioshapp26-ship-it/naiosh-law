import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { mergeAttachments } from "@/lib/entry-attachments";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const existing = body.attachments !== undefined
    ? await prisma.legalClassificationEntry.findUnique({ where: { id }, select: { attachments: true } })
    : null;

  const updated = await prisma.legalClassificationEntry.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      topicName: body.topicName !== undefined ? String(body.topicName) : undefined,
      topicSlug: body.topicSlug !== undefined ? String(body.topicSlug) : undefined,
      jurisdiction: body.jurisdiction !== undefined ? String(body.jurisdiction) : undefined,
      country: body.country !== undefined ? String(body.country) : undefined,
      category: body.category !== undefined ? String(body.category) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      clientName:
        body.client !== undefined
          ? String(body.client)
          : body.clientName !== undefined
            ? String(body.clientName)
            : undefined,
      effectiveDate: body.effectiveDate !== undefined ? String(body.effectiveDate) : undefined,
      source: body.source !== undefined ? String(body.source) : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
      attachments:
        body.attachments !== undefined
          ? mergeAttachments(existing?.attachments, body.attachments)
          : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.legalClassificationEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
