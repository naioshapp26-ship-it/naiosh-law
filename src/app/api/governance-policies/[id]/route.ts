import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprover } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireApprover();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.governancePolicy.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      category: body.category !== undefined ? String(body.category) : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      version: body.version !== undefined ? String(body.version) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireApprover();
  if (error) return error;
  const { id } = await params;
  await prisma.governancePolicy.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
