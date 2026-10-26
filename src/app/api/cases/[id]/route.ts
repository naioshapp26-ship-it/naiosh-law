import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const item = await prisma.case.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  let clientName = body.client !== undefined ? String(body.client) : undefined;
  let clientId: string | null | undefined = undefined;
  if (body.clientId !== undefined) {
    clientId = body.clientId ? String(body.clientId) : null;
    if (clientId) {
      const linked = await prisma.client.findUnique({ where: { id: clientId } });
      if (!linked) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
      if (clientName === undefined) clientName = linked.name;
    }
  }

  const updated = await prisma.case.update({
    where: { id },
    data: {
      clientId,
      clientName,
      type: body.type !== undefined ? String(body.type) : undefined,
      court: body.court !== undefined ? String(body.court) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      nextDate: body.nextDate !== undefined ? String(body.nextDate) : undefined,
      fees: body.fees !== undefined ? String(body.fees) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.case.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
