import { NextResponse } from "next/server";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import {
  loadConversationMessages,
  markMessagesRead,
  sanitizeAttachment,
} from "@/lib/portal-messages";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error, session } = await requireAuth();
  if (error || !session) return error!;
  if (session.role === "client") {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }
  const { id } = await params;
  const data = await loadConversationMessages(id, session, { asClient: false });
  if (!data) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
  await markMessagesRead(id, "staff");
  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error || !session) return error!;
  if (session.role === "client") {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }

  const { id } = await params;
  const prisma = getPrisma();
  const conversation = await prisma.portalConversation.findFirst({
    where: { id, isDemo: false },
  });
  if (!conversation) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
  if (conversation.status === "مغلقة") {
    return NextResponse.json({ error: "المحادثة مغلقة" }, { status: 400 });
  }

  const body = await request.json();
  const text = String(body.body ?? body.message ?? "").trim();
  const att = sanitizeAttachment(body);
  if (!att.ok) return NextResponse.json({ error: att.error }, { status: 400 });
  if (!text && !att.url) return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });

  const now = new Date();
  const msg = await prisma.portalMessage.create({
    data: {
      conversationId: id,
      senderUserId: session.sub,
      senderRole: "staff",
      body: text || "(مرفق)",
      attachmentName: att.name,
      attachmentUrl: att.url,
      attachmentMime: att.mime,
    },
  });

  await prisma.portalConversation.update({
    where: { id },
    data: {
      lastMessageAt: now,
      staffUserId: conversation.staffUserId ?? session.sub,
    },
  });

  await prisma.clientPortalNotification.create({
    data: {
      clientId: conversation.clientId,
      title: "رد جديد من المكتب",
      body: text.slice(0, 160) || "لديك رد جديد على محادثتك",
      category: "رسائل",
      href: `/portal/messages?c=${id}`,
      read: false,
      isDemo: false,
    },
  });

  return NextResponse.json({ message: { id: msg.id, createdAt: msg.createdAt.toISOString() } }, { status: 201 });
}
