import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { persistCustomFieldsFromBody } from "@/lib/page-settings/record-custom-api";
import {
  ensureClientWithContact,
  mapRowWithClientContact,
  findClientContactById,
} from "@/lib/person-contact-server";
import { resolveRequiredCaseFromBody } from "@/lib/case-identity-server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.courtSession.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let clientName = existing.client;
  let contactClientId: string | null = null;

  const hasContact =
    body.phone !== undefined ||
    body.country !== undefined ||
    body.city !== undefined ||
    body.client !== undefined ||
    body.clientId !== undefined;

  if (hasContact) {
    const ensured = await ensureClientWithContact({
      name: body.client !== undefined ? String(body.client) : existing.client ?? "",
      clientId: body.clientId ? String(body.clientId) : null,
      body: body as Record<string, unknown>,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "court-sessions",
      sourceId: id,
      requireComplete: Boolean(
        body.phone !== undefined || body.country !== undefined || body.city !== undefined
      ),
    });
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }
    clientName = ensured.clientName;
    contactClientId = ensured.clientId;
  }

  let caseId = existing.caseId;
  let caseNo = existing.caseNo;
  if (
    body.caseId !== undefined ||
    body.caseNo !== undefined ||
    body.caseRef !== undefined
  ) {
    const resolved = await resolveRequiredCaseFromBody(body as Record<string, unknown>, {
      required: true,
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    caseId = resolved.case!.id;
    caseNo = resolved.case!.caseNo;
  }

  const updated = await prisma.courtSession.update({
    where: { id },
    data: {
      caseId,
      caseNo,
      client: body.client !== undefined || hasContact ? clientName : undefined,
      court: body.court !== undefined ? String(body.court) : undefined,
      room: body.room !== undefined ? String(body.room) : undefined,
      date: body.date !== undefined ? String(body.date) : undefined,
      time: body.time !== undefined ? String(body.time) : undefined,
      type: body.type !== undefined ? String(body.type) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      lawyer: body.lawyer !== undefined ? String(body.lawyer) : undefined,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "court-sessions",
    sourceId: id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  const contact = contactClientId ? await findClientContactById(contactClientId) : null;

  return NextResponse.json(
    mapRowWithClientContact(
      {
        id: updated.id,
        caseId: updated.caseId ?? "",
        caseNo: updated.caseNo ?? "—",
        caseLinks: updated.caseId && updated.caseNo
          ? [{ id: updated.caseId, caseNo: updated.caseNo }]
          : [],
        caseLinkStatus: updated.caseId ? "linked" : "none",
        client: updated.client ?? "—",
        court: updated.court,
        room: updated.room ?? "—",
        date: updated.date,
        time: updated.time ?? "—",
        type: updated.type,
        status: updated.status,
      },
      contact,
      session!.role
    )
  );
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.courtSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
