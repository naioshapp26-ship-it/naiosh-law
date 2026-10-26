import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { SERVICE_REQUEST_TYPES, isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalProfile, loadPortalRequests } from "@/lib/client-portal-data";

export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const requests = await loadPortalRequests(session);
  return NextResponse.json({ requests, types: SERVICE_REQUEST_TYPES });
}

export async function POST(request: Request) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;

  if (isDemoPortalSession(session)) {
    return NextResponse.json(
      {
        error: "الحساب التجريبي للقراءة — أنشئ حساباً حقيقياً لإرسال طلبات فعلية.",
        demoEcho: true,
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const type = String(body.type ?? "").trim();
  const title = String(body.title ?? "").trim();
  const notes = body.notes ? String(body.notes) : null;

  if (!SERVICE_REQUEST_TYPES.includes(type as (typeof SERVICE_REQUEST_TYPES)[number])) {
    return NextResponse.json({ error: "نوع الطلب غير مدعوم" }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "عنوان الطلب مطلوب" }, { status: 400 });

  const profile = await loadPortalProfile(session);
  if (!profile) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  try {
    const prisma = getPrisma();
    const refNo = `REQ-${Date.now().toString().slice(-10)}`;
    const today = new Date().toISOString().slice(0, 10);
    const created = await prisma.clientServiceRequest.create({
      data: {
        clientId: profile.id,
        refNo,
        type,
        title,
        status: "جديد",
        assignee: profile.linkedOffice || "المكتب المرتبط",
        notes,
        lastUpdate: "تم استلام الطلب",
        timeline: JSON.stringify([{ date: today, text: "إنشاء الطلب من بوابة العميل" }]),
        isDemo: false,
      },
    });

    // Mirror consultation-type requests into existing Consultation workflow
    if (type === "طلب استشارة") {
      await prisma.consultation.create({
        data: {
          clientName: profile.name,
          clientId: profile.id,
          topic: title,
          status: "جديد",
          lawyer: profile.lawyerName,
          date: today,
          notes: notes,
        },
      });
    }

    await prisma.clientPortalNotification.create({
      data: {
        clientId: profile.id,
        title: "تم استلام طلبك",
        body: `${type} — المرجع ${refNo}`,
        category: "طلبات",
        href: "/portal/requests",
        read: false,
        isDemo: false,
      },
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "تعذر إنشاء الطلب", details: message }, { status: 500 });
  }
}
