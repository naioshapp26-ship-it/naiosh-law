import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const updated = await prisma.legalArticle.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      author: body.author !== undefined ? String(body.author) || null : undefined,
      summary: body.summary !== undefined ? String(body.summary) || null : undefined,
      content: body.content !== undefined ? String(body.content) || null : undefined,
      tags: body.tags !== undefined ? String(body.tags) || null : undefined,
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
