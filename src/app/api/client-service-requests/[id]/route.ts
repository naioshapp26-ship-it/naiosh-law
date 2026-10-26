import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/** Staff: update portal service request status / notes — mirrors to client portal. */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.clientServiceRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  let timeline: { date: string; text: string }[] = [];
  try {
    const parsed = existing.timeline ? JSON.parse(existing.timeline) : [];
    timeline = Array.isArray(parsed) ? parsed : [];
  } catch {
    timeline = [];
  }

  const status = body.status !== undefined ? String(body.status) : existing.status;
  const lastUpdate =
    body.lastUpdate !== undefined
      ? String(body.lastUpdate)
      : status !== existing.status
        ? `تحديث الحالة إلى: ${status}`
        : existing.lastUpdate;

  if (status !== existing.status) {
    timeline.push({ date: today, text: `تحديث الحالة إلى «${status}» من الموظف المخوّل` });
  }
  if (body.notes !== undefined && String(body.notes) !== (existing.notes ?? "")) {
    timeline.push({ date: today, text: "تحديث ملاحظات الطلب من الإدارة" });
  }

  const updated = await prisma.clientServiceRequest.update({
    where: { id },
    data: {
      status,
      assignee: body.assignee !== undefined ? String(body.assignee) : undefined,
      notes: body.notes !== undefined ? String(body.notes) : undefined,
      lastUpdate,
      timeline: JSON.stringify(timeline),
    },
  });

  // Notify client in portal
  await prisma.clientPortalNotification.create({
    data: {
      clientId: existing.clientId,
      title: "تحديث على طلبك",
      body: `${updated.type} (${updated.refNo}): ${lastUpdate}`,
      category: "طلبات",
      href: "/portal/requests",
      read: false,
      isDemo: false,
    },
  });

  // Keep mirrored Consultation in sync when title/topic matches
  if (existing.type === "طلب استشارة") {
    const consult = await prisma.consultation.findFirst({
      where: { clientId: existing.clientId, topic: existing.title },
      orderBy: { createdAt: "desc" },
    });
    if (consult) {
      await prisma.consultation.update({
        where: { id: consult.id },
        data: { status, notes: updated.notes ?? consult.notes },
      });
    }
  }

  return NextResponse.json(updated);
}

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const row = await prisma.clientServiceRequest.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  if (!row) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json(row);
}
