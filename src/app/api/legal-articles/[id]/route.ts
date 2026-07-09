import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requireWrite, withApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  return withApiError(async () => {
    const updated = await prisma.legalArticle.update({
      where: { id },
      data: {
        title: body.title !== undefined ? String(body.title).trim() : undefined,
        author: body.author !== undefined ? nullableString(body.author) : undefined,
        summary: body.summary !== undefined ? nullableString(body.summary) : undefined,
        content: body.content !== undefined ? nullableString(body.content) : undefined,
        tags: body.tags !== undefined ? nullableString(body.tags) : undefined,
        status: body.status !== undefined ? String(body.status).trim() : undefined,
      },
    });
    return NextResponse.json(updated);
  }, "Update legal article");
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  return withApiError(async () => {
    await prisma.legalArticle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }, "Delete legal article");
}
