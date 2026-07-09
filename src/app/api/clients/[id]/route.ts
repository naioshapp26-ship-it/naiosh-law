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
    const updated = await prisma.client.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name).trim() : undefined,
        type: body.type !== undefined ? String(body.type).trim() : undefined,
        phone: body.phone !== undefined ? nullableString(body.phone) : undefined,
        email: body.email !== undefined ? nullableString(body.email) : undefined,
        nationalId: body.nationalId !== undefined ? nullableString(body.nationalId) : undefined,
        notes: body.notes !== undefined ? nullableString(body.notes) : undefined,
        status: body.status !== undefined ? String(body.status).trim() : undefined,
      },
    });
    return NextResponse.json(updated);
  }, "Update client");
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  return withApiError(async () => {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }, "Delete client");
}
