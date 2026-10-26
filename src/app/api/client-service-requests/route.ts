import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

/** Staff: list portal service requests (consultations / legal services). */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const rows = await prisma.clientServiceRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true, email: true, isDemo: true } } },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      refNo: r.refNo,
      type: r.type,
      title: r.title,
      status: r.status,
      assignee: r.assignee,
      notes: r.notes,
      lastUpdate: r.lastUpdate,
      isDemo: r.isDemo,
      clientId: r.clientId,
      clientName: r.client.name,
      clientEmail: r.client.email,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();
  const clientId = String(body.clientId ?? "").trim();
  if (!clientId) return NextResponse.json({ error: "clientId مطلوب" }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });

  const refNo = String(body.refNo ?? `REQ-${Date.now().toString().slice(-10)}`);
  const today = new Date().toISOString().slice(0, 10);
  const created = await prisma.clientServiceRequest.create({
    data: {
      clientId,
      refNo,
      type: String(body.type ?? "طلب استشارة"),
      title: String(body.title ?? ""),
      status: String(body.status ?? "جديد"),
      assignee: body.assignee ? String(body.assignee) : null,
      notes: body.notes ? String(body.notes) : null,
      lastUpdate: String(body.lastUpdate ?? "تم الإنشاء من الإدارة"),
      timeline: JSON.stringify([{ date: today, text: "إنشاء الطلب من الجهة الإدارية" }]),
      isDemo: false,
    },
  });
  return NextResponse.json({ id: created.id, refNo: created.refNo }, { status: 201 });
}
