import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { ensureClientWithContact } from "@/lib/person-contact-server";
import { resolveRequiredCaseFromBody } from "@/lib/case-identity-server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.personalGuarantee.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let clientName =
    body.client !== undefined ? String(body.client) : existing.clientName;
  let guarantorName =
    body.guarantor !== undefined ? String(body.guarantor) : existing.guarantorName;

  if (
    body.client !== undefined ||
    body.phone !== undefined ||
    body.country !== undefined ||
    body.city !== undefined
  ) {
    const ensured = await ensureClientWithContact({
      name: clientName,
      clientId: body.clientId ? String(body.clientId) : null,
      body,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "personal-guarantees",
      sourceId: id,
      requireComplete: Boolean(body.phone || body.country || body.city),
    });
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }
    clientName = ensured.clientName;
  }

  if (
    body.guarantor !== undefined ||
    body.guarantorPhone !== undefined ||
    body.guarantorPhoneDialCode !== undefined ||
    body.guarantorPhoneSecondary !== undefined ||
    body.guarantorPhoneSecondaryDialCode !== undefined ||
    body.guarantorCountry !== undefined ||
    body.guarantorCity !== undefined
  ) {
    const ensuredG = await ensureClientWithContact({
      name: guarantorName,
      body: {
        phone: body.guarantorPhone,
        phoneDialCode: body.guarantorPhoneDialCode,
        phoneSecondary: body.guarantorPhoneSecondary,
        phoneSecondaryDialCode: body.guarantorPhoneSecondaryDialCode,
        country: body.guarantorCountry,
        city: body.guarantorCity,
      },
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "personal-guarantees-guarantor",
      sourceId: id,
      requireComplete: Boolean(
        body.guarantorPhone || body.guarantorCountry || body.guarantorCity
      ),
    });
    if (!ensuredG.ok) {
      return NextResponse.json({ error: ensuredG.error }, { status: ensuredG.status });
    }
    guarantorName = ensuredG.clientName;
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

  const updated = await prisma.personalGuarantee.update({
    where: { id },
    data: {
      caseRef,
      clientName,
      guarantorName,
      relationship: body.relationship !== undefined ? String(body.relationship) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      documents: body.documents !== undefined ? String(body.documents) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.personalGuarantee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
