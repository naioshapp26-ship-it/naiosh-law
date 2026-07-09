import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite, parseJsonBody, prismaErrorResponse } from "@/lib/api-helpers";

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
  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  try {
    const updated = await prisma.case.update({
      where: { id },
      data: {
        clientName: body.client !== undefined ? String(body.client) : undefined,
        type: body.type !== undefined ? String(body.type) : undefined,
        court: body.court !== undefined ? String(body.court) : undefined,
        status: body.status !== undefined ? String(body.status) : undefined,
        nextDate: body.nextDate !== undefined ? String(body.nextDate) : undefined,
        fees: body.fees !== undefined ? String(body.fees) : undefined,
        notes: body.notes !== undefined ? String(body.notes) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const response = prismaErrorResponse(err);
    if (response) return response;
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  try {
    await prisma.case.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const response = prismaErrorResponse(err);
    if (response) return response;
    throw err;
  }
}
