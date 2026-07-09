import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { generateRefNo, labelSignatureStatus, logAudit } from "@/lib/governance";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const items = await prisma.eSignature.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(
    items.map((s) => ({
      id: s.id,
      refNo: s.refNo,
      documentTitle: s.documentTitle,
      documentRef: s.documentRef ?? "—",
      signer: s.signerName,
      signerEmail: s.signerEmail ?? "—",
      signerRole: s.signerRole ?? "—",
      status: labelSignatureStatus(s.status),
      statusRaw: s.status,
      signedAt: s.signedAt ?? "—",
      expiresAt: s.expiresAt ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const count = await prisma.eSignature.count();
  const refNo = generateRefNo("SIG", count + 1);

  const created = await prisma.eSignature.create({
    data: {
      refNo,
      documentTitle: String(body.documentTitle ?? ""),
      documentRef: body.documentRef ? String(body.documentRef) : null,
      signerName: String(body.signerName ?? session!.name),
      signerEmail: body.signerEmail ? String(body.signerEmail) : session!.email,
      signerRole: body.signerRole ? String(body.signerRole) : null,
      userId: session!.sub,
      expiresAt: body.expiresAt ? String(body.expiresAt) : null,
    },
  });

  await logAudit({
    userId: session!.sub,
    action: "create_signature_request",
    entity: "e_signature",
    entityId: created.id,
    details: created.documentTitle,
  });

  return NextResponse.json(created, { status: 201 });
}
