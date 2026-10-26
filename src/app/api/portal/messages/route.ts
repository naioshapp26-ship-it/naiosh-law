import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalProfile } from "@/lib/client-portal-data";
import {
  listClientConversations,
  resolveDefaultStaffUserId,
  sanitizeAttachment,
} from "@/lib/portal-messages";

/** List conversations for the authenticated client */
export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const conversations = await listClientConversations(session);
  return NextResponse.json({ conversations });
}

/** Start a new conversation + first message */
export async function POST(request: Request) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;

  if (isDemoPortalSession(session)) {
    return NextResponse.json(
      { error: "الحساب التجريبي للقراءة فقط — أنشئ حسابًا حقيقيًا للمراسلة" },
      { status: 403 }
    );
  }

  const profile = await loadPortalProfile(session);
  if (!profile) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  const body = await request.json();
  const subject = String(body.subject ?? "").trim();
  const text = String(body.body ?? body.message ?? "").trim();
  const caseId = body.caseId ? String(body.caseId) : null;
  const requestId = body.requestId ? String(body.requestId) : null;
  const att = sanitizeAttachment(body);
  if (!att.ok) return NextResponse.json({ error: att.error }, { status: 400 });
  if (!subject) return NextResponse.json({ error: "موضوع المحادثة مطلوب" }, { status: 400 });
  if (!text && !att.url) return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });

  try {
    const prisma = getPrisma();
    if (caseId) {
      const owned = await prisma.case.findFirst({ where: { id: caseId, clientId: profile.id } });
      if (!owned) return NextResponse.json({ error: "القضية غير مرتبطة بحسابك" }, { status: 403 });
    }
    if (requestId) {
      const owned = await prisma.clientServiceRequest.findFirst({
        where: { id: requestId, clientId: profile.id },
      });
      if (!owned) return NextResponse.json({ error: "الطلب غير مرتبط بحسابك" }, { status: 403 });
    }

    const staffUserId = await resolveDefaultStaffUserId();
    const now = new Date();
    const conversation = await prisma.portalConversation.create({
      data: {
        clientId: profile.id,
        staffUserId,
        subject,
        caseId,
        requestId,
        status: "مفتوحة",
        isDemo: false,
        lastMessageAt: now,
        messages: {
          create: {
            senderUserId: session.sub,
            senderRole: "client",
            body: text || "(مرفق)",
            attachmentName: att.name,
            attachmentUrl: att.url,
            attachmentMime: att.mime,
          },
        },
      },
    });

    await prisma.clientPortalNotification.create({
      data: {
        clientId: profile.id,
        title: "تم إرسال رسالتك",
        body: subject,
        category: "رسائل",
        href: `/portal/messages?c=${conversation.id}`,
        read: false,
        isDemo: false,
      },
    });

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "تعذر إنشاء المحادثة", details: message }, { status: 500 });
  }
}
