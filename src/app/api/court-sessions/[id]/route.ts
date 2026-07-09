import { prisma } from "@/lib/prisma";
import { jsonResponse, readJsonBody, requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const updated = await prisma.courtSession.update({
    where: { id },
    data: {
      caseNo: body.caseNo !== undefined ? String(body.caseNo) : undefined,
      client: body.client !== undefined ? String(body.client) : undefined,
      court: body.court !== undefined ? String(body.court) : undefined,
      room: body.room !== undefined ? String(body.room) : undefined,
      date: body.date !== undefined ? String(body.date) : undefined,
      time: body.time !== undefined ? String(body.time) : undefined,
      type: body.type !== undefined ? String(body.type) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      lawyer: body.lawyer !== undefined ? String(body.lawyer) : undefined,
    },
  });
  return jsonResponse(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.courtSession.delete({ where: { id } });
  return jsonResponse({ ok: true });
}
