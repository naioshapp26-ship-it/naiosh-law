import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, prismaErrorResponse, readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";
import { generateRefNo, labelSignatureStatus, logAudit } from "@/lib/governance";

const approverRoles = new Set(["admin", "industrial_agent"]);

async function nextSignatureRefNo() {
  const year = new Date().getFullYear();
  const prefix = `SIG-${year}-`;
  const latest = await prisma.eSignature.findFirst({
    where: { refNo: { startsWith: prefix } },
    orderBy: { refNo: "desc" },
    select: { refNo: true },
  });
  const latestSeq = latest ? Number.parseInt(latest.refNo.slice(prefix.length), 10) : 0;
  return generateRefNo("SIG", Number.isFinite(latestSeq) ? latestSeq + 1 : 1);
}

async function createSignatureWithRef(data: {
  documentTitle: string;
  documentRef: string | null;
  signerName: string;
  signerEmail: string | null;
  signerRole: string | null;
  userId: string | null;
  expiresAt: string | null;
}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.eSignature.create({
        data: {
          ...data,
          refNo: await nextSignatureRefNo(),
        },
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unable to allocate signature reference");
}

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const items = await prisma.eSignature.findMany({
      where: approverRoles.has(session!.role)
        ? undefined
        : {
            OR: [{ userId: session!.sub }, { signerEmail: session!.email }],
          },
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
        canAct:
          s.status === "pending" &&
          (approverRoles.has(session!.role) || s.userId === session!.sub || s.signerEmail === session!.email),
        status: labelSignatureStatus(s.status),
        statusRaw: s.status,
        signedAt: s.signedAt ?? "—",
        expiresAt: s.expiresAt ?? "—",
      }))
    );
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { data: body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const documentTitle = String(body!.documentTitle ?? "").trim();
  if (!documentTitle) return jsonError("عنوان المستند مطلوب", 400);

  const signerEmail = body!.signerEmail ? String(body!.signerEmail).trim().toLowerCase() : session!.email;
  const signerName = String(body!.signerName ?? session!.name).trim();
  const userId =
    typeof body!.userId === "string"
      ? body!.userId
      : signerEmail === session!.email
        ? session!.sub
        : null;

  try {
    const created = await createSignatureWithRef({
      documentTitle,
      documentRef: body!.documentRef ? String(body!.documentRef) : null,
      signerName,
      signerEmail,
      signerRole: body!.signerRole ? String(body!.signerRole) : null,
      userId,
      expiresAt: body!.expiresAt ? String(body!.expiresAt) : null,
    });

    await logAudit({
      userId: session!.sub,
      action: "create_signature_request",
      entity: "e_signature",
      entityId: created.id,
      details: created.documentTitle,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
