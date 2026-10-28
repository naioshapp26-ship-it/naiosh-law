import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { formatDate } from "@/lib/format";
import { displayResolvedCase, NO_LINKED_CASE } from "@/lib/case-identity";
import { resolveCaseById, resolveCaseRef } from "@/lib/case-identity-server";

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

  const out = [];
  for (const n of items) {
    const resolved = await resolveCaseRef(n.caseRef);
    const caseDisplay = displayResolvedCase(resolved);
    out.push({
      id: n.id,
      type: n.type,
      status: n.status,
      caseRef: n.caseRef ?? "",
      caseNo: caseDisplay.caseNo,
      caseId: caseDisplay.caseId ?? "",
      caseLinks: caseDisplay.caseLinks,
      caseLinkStatus: caseDisplay.caseLinkStatus,
      message: n.message ?? "",
      from: n.requester.name,
      to: n.receiver.name,
      date: formatDate(n.createdAt, { month: "numeric", day: "numeric", year: "numeric" }),
    });
  }
  return NextResponse.json(out);
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

  let caseRef: string | null = null;
  if (body.caseId) {
    const linked = await resolveCaseById(String(body.caseId));
    if (!linked) {
      return NextResponse.json({ error: "القضية غير موجودة في السجل المركزي" }, { status: 400 });
    }
    caseRef = linked.caseNo;
  } else if (body.caseNo || body.caseRef) {
    const raw = String(body.caseNo ?? body.caseRef).trim();
    if (raw && raw !== NO_LINKED_CASE) {
      const resolved = await resolveCaseRef(raw);
      if (resolved.status !== "linked") {
        return NextResponse.json(
          {
            error:
              "لا يُسمح بربط رقم قضية غير موجود — اختر من السجل الحقيقي أو اترك الحقل فارغًا",
          },
          { status: 400 }
        );
      }
      caseRef = resolved.case.caseNo;
    }
  }

  const created = await prisma.professionalNetwork.create({
    data: {
      requesterId: session!.sub,
      receiverId,
      type: body.type ?? "collaboration",
      caseRef,
      message: body.message ? String(body.message) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
