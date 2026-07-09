import { prisma } from "@/lib/prisma";
import { jsonError, jsonResponse, readJsonBody, requireAuth, requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const item = await prisma.case.findUnique({ where: { id } });
  if (!item) return jsonError("غير موجود", 404);
  return jsonResponse(item);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

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
  return jsonResponse(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.case.delete({ where: { id } });
  return jsonResponse({ ok: true });
}
