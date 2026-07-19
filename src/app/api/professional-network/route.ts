import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { getSessionFromCookies } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const items = await prisma.professionalNetwork.findMany({
    where: {
      OR: [{ requesterId: session!.sub }, { receiverId: session!.sub }],
    },
    orderBy: { createdAt: "desc" },
    include: { requester: true, receiver: true },
  });

  return NextResponse.json(
    items.map((n) => ({
      id: n.id,
      type: n.type,
      status: n.status,
      caseRef: n.caseRef ?? "—",
      message: n.message ?? "",
      from: n.requester.name,
      to: n.receiver.name,
      date: formatDate(n.createdAt, { month: "numeric", day: "numeric", year: "numeric" }),
    }))
  );
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  let receiverId = body.receiverId ? String(body.receiverId) : "";

  // قبول معرف محترف وربطه بمستخدم إن وُجد
  if (body.professionalId) {
    const pro = await prisma.professional.findUnique({ where: { id: String(body.professionalId) } });
    if (!pro?.userId) {
      return NextResponse.json(
        { error: "هذا المحترف غير مرتبط بحساب مستخدم — اختر محترفًا آخر أو أضفه كمستخدم أولًا" },
        { status: 400 }
      );
    }
    receiverId = pro.userId;
  }

  if (!receiverId) {
    return NextResponse.json({ error: "المستلم مطلوب" }, { status: 400 });
  }

  if (receiverId === session!.sub) {
    return NextResponse.json({ error: "لا يمكن إرسال طلب لنفسك" }, { status: 400 });
  }

  const created = await prisma.professionalNetwork.create({
    data: {
      requesterId: session!.sub,
      receiverId,
      type: body.type ?? "collaboration",
      caseRef: body.caseRef ? String(body.caseRef) : null,
      message: body.message ? String(body.message) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
