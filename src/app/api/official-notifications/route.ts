import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { NotificationType } from "@/generated/prisma/client";

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
  return NextResponse.json(
    items.map((n) => ({
      id: n.id,
      type: typeLabels[n.type] ?? n.type,
      title: n.title,
      entity: n.entityName,
      caseRef: n.caseRef ?? "—",
      dueDate: n.dueDate ?? "—",
      status: n.status,
      deliveryMethod: n.deliveryMethod ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.officialNotification.create({
    data: {
      type: (body.type as NotificationType) ?? "other",
      title: String(body.title ?? ""),
      entityName: String(body.entity ?? body.entityName ?? ""),
      caseRef: body.caseRef ? String(body.caseRef) : null,
      dueDate: body.dueDate ? String(body.dueDate) : null,
      status: String(body.status ?? "قيد المتابعة"),
      deliveryMethod: body.deliveryMethod ? String(body.deliveryMethod) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
