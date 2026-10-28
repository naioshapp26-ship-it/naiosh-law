import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { persistCustomFieldsFromBody } from "@/lib/page-settings/record-custom-api";
import {
  ensureClientWithContact,
  mapRowWithClientContact,
} from "@/lib/person-contact-server";
import { displayResolvedCase } from "@/lib/case-identity";
import {
  resolveCaseRef,
  resolveRequiredCaseFromBody,
} from "@/lib/case-identity-server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.financialRecord.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let clientId = existing.clientId;
  let clientName = existing.clientName;
  const hasContact =
    body.phone !== undefined ||
    body.country !== undefined ||
    body.city !== undefined ||
    body.client !== undefined ||
    body.clientId !== undefined;

  if (hasContact) {
    const ensured = await ensureClientWithContact({
      name: body.client !== undefined ? String(body.client) : existing.clientName,
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
      sourceModule: "legal-accounting",
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

  let caseRef = existing.caseRef;
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
    caseRef = resolved.case!.caseNo;
  }

  const updated = await prisma.financialRecord.update({
    where: { id },
    data: {
      clientId,
      clientName: body.client !== undefined || hasContact ? clientName : undefined,
      type: body.type !== undefined ? String(body.type) : undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      paid: body.paid !== undefined ? Number(body.paid) : undefined,
      issueDate: body.issueDate !== undefined ? String(body.issueDate) : undefined,
      dueDate: body.dueDate !== undefined ? String(body.dueDate) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
      caseRef,
    },
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

  await persistCustomFieldsFromBody({
    sourceModule: "legal-accounting",
    sourceId: id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  const caseDisplay = displayResolvedCase(await resolveCaseRef(updated.caseRef));

  return NextResponse.json(
    mapRowWithClientContact(
      {
        id: updated.id,
        invoiceNo: updated.invoiceNo,
        client: updated.clientName,
        type: updated.type,
        amount: String(updated.amount),
        paid: String(updated.paid),
        issueDate: updated.issueDate,
        status: updated.status,
        caseRef: updated.caseRef ?? "",
        caseNo: caseDisplay.caseNo,
        caseId: caseDisplay.caseId ?? "",
        caseLinks: caseDisplay.caseLinks,
        caseLinkStatus: caseDisplay.caseLinkStatus,
      },
      updated.client,
      session!.role
    )
  );
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.financialRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
