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

  const existing = await prisma.bailGuarantee.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let clientName =
    body.client !== undefined ? String(body.client) : existing.clientName;

  if (
    body.client !== undefined ||
    body.phone !== undefined ||
    body.country !== undefined ||
    body.city !== undefined ||
    body.phoneDialCode !== undefined
  ) {
    const ensured = await ensureClientWithContact({
      name: clientName,
      clientId: body.clientId ? String(body.clientId) : null,
      body,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "bail-guarantees",
      sourceId: id,
      requireComplete: Boolean(body.phone || body.country || body.city),
    });
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }
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

  const updated = await prisma.bailGuarantee.update({
    where: { id },
    data: {
      caseRef,
      clientName,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      court: body.court !== undefined ? String(body.court) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      depositDate: body.depositDate !== undefined ? String(body.depositDate) : undefined,
      refundDate: body.refundDate !== undefined ? String(body.refundDate) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.bailGuarantee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
