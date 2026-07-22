import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.legalArticle.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      author: body.author !== undefined ? String(body.author) : undefined,
      summary: body.summary !== undefined ? String(body.summary) : undefined,
      content: body.content !== undefined ? String(body.content) : undefined,
      mediaUrl: body.mediaUrl !== undefined ? (body.mediaUrl ? String(body.mediaUrl) : null) : undefined,
      mediaKind: body.mediaKind !== undefined ? (body.mediaKind ? String(body.mediaKind) : null) : undefined,
      tags: body.tags !== undefined ? String(body.tags) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.legalArticle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
