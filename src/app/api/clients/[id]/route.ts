import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import {
  applyContactToClient,
  mapRowWithClientContact,
  findClientContactById,
} from "@/lib/person-contact-server";
import { canViewPersonContact } from "@/lib/person-contact";
import { formatDate, formatNumber } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error, session } = await requireAuth();
  if (error) return error;
  if (session!.role === "client") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const item = await findClientContactById(id);
  if (!item) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const full = await prisma.client.findUnique({ where: { id } });
  if (!full) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const mapped = mapRowWithClientContact(
    {
      id: full.id,
      name: full.name,
      type: full.type,
      email: full.email ?? "—",
      cases: formatNumber(full.casesCount, { maximumFractionDigits: 0 }),
      status: full.status,
      since: formatDate(full.since),
    },
    item,
    canViewPersonContact(session!.role) ? session!.role : null
  );

  const [withCustom] = await attachCustomValuesToRows("clients-management", [mapped]);
  return NextResponse.json(withCustom);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const applied = await applyContactToClient({
    clientId: id,
    body: body as Record<string, unknown>,
    role: session!.role,
    changedById: session!.sub,
    changedByName: session!.name ?? session!.email,
    sourceModule: "clients-management",
    sourceId: id,
    requireComplete: Boolean(
      body.phone !== undefined || body.country !== undefined || body.city !== undefined
    ),
  });
  if (!applied.ok) {
    return NextResponse.json({ error: applied.error }, { status: applied.status });
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : undefined,
      type: body.type !== undefined ? String(body.type) : undefined,
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

  const mapped = mapRowWithClientContact(
    {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      email: updated.email ?? "—",
      status: updated.status,
    },
    applied.client,
    session!.role
  );

  return NextResponse.json(mapped);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
