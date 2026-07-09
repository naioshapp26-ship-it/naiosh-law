import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import type { LibraryDocumentType } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.legalDocument.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      type: body.type !== undefined ? (body.type as LibraryDocumentType) : undefined,
      category: body.category !== undefined ? String(body.category) : undefined,
      summary: body.summary !== undefined ? String(body.summary) : undefined,
      content: body.content !== undefined ? String(body.content) : undefined,
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
  await prisma.legalDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
