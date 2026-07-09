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

  const updated = await prisma.client.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : undefined,
      type: body.type !== undefined ? String(body.type) : undefined,
      phone: body.phone !== undefined ? String(body.phone) || null : undefined,
      email: body.email !== undefined ? String(body.email) || null : undefined,
      nationalId: body.nationalId !== undefined ? String(body.nationalId) || null : undefined,
      notes: body.notes !== undefined ? String(body.notes) || null : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
