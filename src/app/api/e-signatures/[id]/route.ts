import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, prismaErrorResponse, readJsonObject, requestIp, requireAuth } from "@/lib/api-helpers";
import { generateSignatureHash, logAudit } from "@/lib/governance";

type Params = { params: Promise<{ id: string }> };

const proxySignerRoles = new Set(["admin", "industrial_agent"]);

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return false;
  const endOfDay = new Date(expires);
  if (/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    endOfDay.setHours(23, 59, 59, 999);
  }
  return endOfDay.getTime() < Date.now();
}

export async function POST(request: Request, { params }: Params) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const { data: body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  try {
    const existing = await prisma.eSignature.findUnique({ where: { id } });
    if (!existing) return jsonError("طلب التوقيع غير موجود", 404);
    if (existing.status !== "pending") return jsonError("تمت معالجة هذا الطلب مسبقاً", 400);

    const canAct =
      proxySignerRoles.has(session!.role) ||
      existing.userId === session!.sub ||
      (existing.signerEmail ? existing.signerEmail.toLowerCase() === session!.email.toLowerCase() : false);

    if (!canAct) return jsonError("غير مصرح بتنفيذ هذا الإجراء على طلب التوقيع", 403);

    if (isExpired(existing.expiresAt)) {
      await prisma.eSignature.update({ where: { id }, data: { status: "expired" } });
      await logAudit({
        userId: session!.sub,
        action: "expire_signature",
        entity: "e_signature",
        entityId: id,
        details: existing.documentTitle,
        severity: "warning",
        ipAddress: requestIp(request),
      });
      return jsonError("انتهت صلاحية طلب التوقيع", 410);
    }

    const action = body!.action === "reject" ? "reject" : "sign";
    const signedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
    const ipAddress = requestIp(request);

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
        ipAddress,
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
        ipAddress,
      },
    });

    await logAudit({
      userId: session!.sub,
      action: "sign_document",
      entity: "e_signature",
      entityId: id,
      details: `${existing.documentTitle} — hash: ${signatureHash}`,
      ipAddress,
    });

    return NextResponse.json({
      ...updated,
      message: "تم التوقيع الإلكتروني بنجاح",
    });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
