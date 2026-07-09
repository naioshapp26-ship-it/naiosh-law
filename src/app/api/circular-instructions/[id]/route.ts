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
    const updated = await prisma.circularInstruction.update({
      where: { id },
      data: {
        title: body.title !== undefined ? String(body.title).trim() : undefined,
        issuer: body.issuer !== undefined ? String(body.issuer).trim() : undefined,
        summary: body.summary !== undefined ? nullableString(body.summary) : undefined,
        content: body.content !== undefined ? nullableString(body.content) : undefined,
        status: body.status !== undefined ? String(body.status).trim() : undefined,
        effectiveDate: body.effectiveDate !== undefined ? nullableString(body.effectiveDate) : undefined,
      },
    });
    return NextResponse.json(updated);
  }, "Update circular instruction");
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  return withApiError(async () => {
    await prisma.circularInstruction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }, "Delete circular instruction");
}
