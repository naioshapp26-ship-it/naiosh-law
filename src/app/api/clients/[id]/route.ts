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
  return jsonResponse(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.client.delete({ where: { id } });
  return jsonResponse({ ok: true });
}
