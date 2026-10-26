import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalProfile } from "@/lib/client-portal-data";
import {
  loadConversationMessages,
  markMessagesRead,
  sanitizeAttachment,
} from "@/lib/portal-messages";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const { id } = await params;

  const profile = isDemoPortalSession(session) ? null : await loadPortalProfile(session);
  const data = await loadConversationMessages(id, session, {
    asClient: true,
    clientId: profile?.id,
  });
  if (!data) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });

  if (!isDemoPortalSession(session)) {
    await markMessagesRead(id, "client");
  }

  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: Params) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  if (isDemoPortalSession(session)) {
    return NextResponse.json({ error: "الحساب التجريبي للقراءة فقط" }, { status: 403 });
  }

  const { id } = await params;
  const profile = await loadPortalProfile(session);
  if (!profile) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  const prisma = getPrisma();
  const conversation = await prisma.portalConversation.findFirst({
    where: { id, clientId: profile.id, isDemo: false },
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
      senderRole: "client",
      body: text || "(مرفق)",
      attachmentName: att.name,
      attachmentUrl: att.url,
      attachmentMime: att.mime,
    },
  });
  await prisma.portalConversation.update({
    where: { id },
    data: { lastMessageAt: now },
  });

  return NextResponse.json({ message: { id: msg.id, createdAt: msg.createdAt.toISOString() } }, { status: 201 });
}
