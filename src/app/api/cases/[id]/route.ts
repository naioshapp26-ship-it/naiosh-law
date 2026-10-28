import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import { assertPageAction } from "@/lib/page-settings/page-action-auth";
import {
  ensureClientWithContact,
  mapRowWithClientContact,
  findClientContactById,
} from "@/lib/person-contact-server";
import { canViewPersonContact } from "@/lib/person-contact";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const item = await prisma.case.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          phoneDialCode: true,
          phoneSecondary: true,
          phoneSecondaryDialCode: true,
          primaryPhoneSlot: true,
          country: true,
          city: true,
          countrySecondary: true,
          citySecondary: true,
          primaryAddressSlot: true,
        },
      },
    },
  });
  if (!item) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const role = session!.role;
  const canView = canViewPersonContact(role);
  const mapped = mapRowWithClientContact(
    {
      id: item.id,
      caseNo: item.caseNo,
      client: item.clientName,
      type: item.type,
      court: item.court,
      status: item.status,
      nextDate: item.nextDate ?? "—",
      fees: item.fees ?? "0",
      notes: item.notes,
    },
    item.client,
    canView ? role : null
  );

  const [withCustom] = await attachCustomValuesToRows("case-management", [mapped]);
  return NextResponse.json(withCustom);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;

  const gate = await assertPageAction({
    pageKey: "case-management",
    action: "edit",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.case.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const clientNameInput =
    body.client !== undefined
      ? String(body.client)
      : body.clientName !== undefined
        ? String(body.clientName)
        : existing.clientName;

  const hasContactPatch =
    body.phone !== undefined ||
    body.phoneDialCode !== undefined ||
    body.country !== undefined ||
    body.city !== undefined ||
    body.clientId !== undefined ||
    body.client !== undefined;

  let clientId = existing.clientId;
  let clientName = clientNameInput;

  if (hasContactPatch || body.clientId !== undefined || body.client !== undefined) {
    const ensured = await ensureClientWithContact({
      name: clientNameInput,
      clientId:
        body.clientId !== undefined
          ? body.clientId
            ? String(body.clientId)
            : null
          : existing.clientId,
      body: body as Record<string, unknown>,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "case-management",
      sourceId: id,
      requireComplete: Boolean(
        body.phone !== undefined || body.country !== undefined || body.city !== undefined
      ),
    });
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }
    clientId = ensured.clientId;
    clientName = ensured.clientName;
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

  await persistCustomFieldsFromBody({
    sourceModule: "case-management",
    sourceId: id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  const contact = clientId ? await findClientContactById(clientId) : null;
  const mapped = mapRowWithClientContact(
    {
      id: updated.id,
      caseNo: updated.caseNo,
      client: updated.clientName,
      type: updated.type,
      court: updated.court,
      status: updated.status,
      nextDate: updated.nextDate ?? "—",
      fees: updated.fees ?? "0",
    },
    contact,
    session!.role
  );

  return NextResponse.json(mapped);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;

  const gate = await assertPageAction({
    pageKey: "case-management",
    action: "delete",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const { id } = await params;
  await prisma.case.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
