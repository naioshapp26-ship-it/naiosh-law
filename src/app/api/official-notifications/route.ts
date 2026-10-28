import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { NotificationType } from "@/generated/prisma/client";
import { displayResolvedCase } from "@/lib/case-identity";
import { resolveCaseById, resolveCaseRef } from "@/lib/case-identity-server";

const typeLabels: Record<NotificationType, string> = {
  court_summons: "استدعاء محكمة",
  bail_deadline: "موعد كفالة",
  document_submission: "تسليم مستندات",
  judgment_delivery: "إعلان حكم",
  other: "أخرى",
};

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const items = await prisma.officialNotification.findMany({ orderBy: { createdAt: "desc" } });
  const out = [];
  for (const n of items) {
    const resolved = await resolveCaseRef(n.caseRef);
    const caseDisplay = displayResolvedCase(resolved);
    out.push({
      id: n.id,
      type: typeLabels[n.type] ?? n.type,
      title: n.title,
      entity: n.entityName,
      caseRef: n.caseRef ?? "—",
      caseNo: caseDisplay.caseNo,
      caseId: caseDisplay.caseId ?? "",
      caseLinks: caseDisplay.caseLinks,
      caseLinkStatus: caseDisplay.caseLinkStatus,
      dueDate: n.dueDate ?? "—",
      status: n.status,
      deliveryMethod: n.deliveryMethod ?? "—",
    });
  }
  return NextResponse.json(out);
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  let caseRef: string | null = null;
  if (body.caseId) {
    const linked = await resolveCaseById(String(body.caseId));
    if (!linked) {
      return NextResponse.json({ error: "القضية غير موجودة في السجل المركزي" }, { status: 400 });
    }
    caseRef = linked.caseNo;
  } else if (body.caseNo || body.caseRef) {
    const resolved = await resolveCaseRef(String(body.caseNo ?? body.caseRef));
    if (resolved.status === "linked") caseRef = resolved.case.caseNo;
    else caseRef = String(body.caseNo ?? body.caseRef).trim() || null;
  }

  const created = await prisma.officialNotification.create({
    data: {
      type: (body.type as NotificationType) ?? "other",
      title: String(body.title ?? ""),
      entityName: String(body.entity ?? body.entityName ?? ""),
      caseRef,
      dueDate: body.dueDate ? String(body.dueDate) : null,
      status: String(body.status ?? "قيد المتابعة"),
      deliveryMethod: body.deliveryMethod ? String(body.deliveryMethod) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
