import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";
import { generateSignatureHash, logAudit } from "@/lib/governance";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.eSignature.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "طلب التوقيع غير موجود" }, { status: 404 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json({ error: "تمت معالجة هذا الطلب مسبقاً" }, { status: 400 });
  }

  const action = body.action === "reject" ? "reject" : "sign";
  const signedAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  if (action === "reject") {
    const updated = await prisma.eSignature.update({
      where: { id },
      data: { status: "rejected", signedAt },
    });
    await logAudit({
      userId: session!.sub,
      action: "reject_signature",
      entity: "e_signature",
      entityId: id,
      details: existing.documentTitle,
      severity: "warning",
    });
    return NextResponse.json(updated);
  }

  const signatureHash = generateSignatureHash(
    existing.documentRef ?? existing.refNo,
    existing.signerName,
    signedAt
  );

  const updated = await prisma.eSignature.update({
    where: { id },
    data: {
      status: "signed",
      signedAt,
      signatureHash,
      ipAddress: body.ipAddress ? String(body.ipAddress) : "127.0.0.1",
    },
  });

  await logAudit({
    userId: session!.sub,
    action: "sign_document",
    entity: "e_signature",
    entityId: id,
    details: `${existing.documentTitle} — hash: ${signatureHash}`,
  });

  return NextResponse.json({
    ...updated,
    message: "تم التوقيع الإلكتروني بنجاح",
  });
}
