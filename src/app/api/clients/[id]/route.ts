import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const item = await prisma.client.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const [withCustom] = await attachCustomValuesToRows("clients-management", [item]);
  return NextResponse.json(withCustom);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.client.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : undefined,
      type: body.type !== undefined ? String(body.type) : undefined,
      phone: body.phone !== undefined ? String(body.phone) : undefined,
      email: body.email !== undefined ? String(body.email) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "clients-management",
    sourceId: id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
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
