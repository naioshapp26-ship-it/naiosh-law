import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite, parseJsonBody } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const updated = await prisma.officeBranch.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : undefined,
      city: body.city !== undefined ? String(body.city) : undefined,
      phone: body.phone !== undefined ? String(body.phone) : undefined,
      email: body.email !== undefined ? String(body.email) : undefined,
      managerName: body.manager !== undefined ? String(body.manager) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.officeBranch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
