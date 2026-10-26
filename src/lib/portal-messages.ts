import type { AuthPayload } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalProfile } from "@/lib/client-portal-data";
import type { PortalConversationDto, PortalMessageDto } from "@/lib/portal-messages-types";

export type { PortalConversationDto, PortalMessageDto } from "@/lib/portal-messages-types";

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export function sanitizeAttachment(input: {
  attachmentName?: unknown;
  attachmentUrl?: unknown;
  attachmentMime?: unknown;
}): { ok: true; name: string | null; url: string | null; mime: string | null } | { ok: false; error: string } {
  const name = input.attachmentName ? String(input.attachmentName).slice(0, 180) : null;
  const url = input.attachmentUrl ? String(input.attachmentUrl) : null;
  const mime = input.attachmentMime ? String(input.attachmentMime) : null;
  if (!url && !name && !mime) return { ok: true, name: null, url: null, mime: null };
  if (!url || !name || !mime) return { ok: false, error: "المرفق غير مكتمل" };
  if (!ALLOWED_MIME.has(mime)) return { ok: false, error: "نوع المرفق غير مسموح" };
  // Rough size check for data URLs
  if (url.startsWith("data:")) {
    const b64 = url.split(",")[1] || "";
    const approx = Math.floor((b64.length * 3) / 4);
    if (approx > MAX_ATTACHMENT_BYTES) return { ok: false, error: "حجم المرفق يتجاوز 2MB" };
  } else if (!url.startsWith("/") && !url.startsWith("https://")) {
    return { ok: false, error: "رابط المرفق غير آمن" };
  }
  return { ok: true, name, url, mime };
}

export async function resolveDefaultStaffUserId(): Promise<string | null> {
  const prisma = getPrisma();
  const lawyer = await prisma.user.findFirst({
    where: { role: "lawyer", active: true },
    orderBy: { createdAt: "asc" },
  });
  if (lawyer) return lawyer.id;
  const admin = await prisma.user.findFirst({
    where: { role: "admin", active: true },
    orderBy: { createdAt: "asc" },
  });
  return admin?.id ?? null;
}

export async function listClientConversations(session: AuthPayload): Promise<PortalConversationDto[]> {
  if (isDemoPortalSession(session)) {
    return demoConversations();
  }
  const profile = await loadPortalProfile(session);
  if (!profile) return [];
  const prisma = getPrisma();
  const rows = await prisma.portalConversation.findMany({
    where: { clientId: profile.id, isDemo: false },
    orderBy: { lastMessageAt: "desc" },
    include: {
      staffUser: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const unread = await prisma.portalMessage.groupBy({
    by: ["conversationId"],
    where: {
      conversation: { clientId: profile.id },
      senderRole: "staff",
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status,
    caseId: r.caseId,
    requestId: r.requestId,
    clientId: r.clientId,
    clientName: r.client.name,
    staffUserId: r.staffUserId,
    staffName: r.staffUser?.name ?? null,
    lastMessageAt: r.lastMessageAt.toISOString(),
    unreadCount: unreadMap.get(r.id) ?? 0,
    preview: r.messages[0]?.body?.slice(0, 120) ?? null,
    isDemo: r.isDemo,
  }));
}

export async function listStaffConversations(): Promise<PortalConversationDto[]> {
  const prisma = getPrisma();
  const rows = await prisma.portalConversation.findMany({
    where: { isDemo: false },
    orderBy: { lastMessageAt: "desc" },
    include: {
      staffUser: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const unread = await prisma.portalMessage.groupBy({
    by: ["conversationId"],
    where: { senderRole: "client", readAt: null, conversation: { isDemo: false } },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status,
    caseId: r.caseId,
    requestId: r.requestId,
    clientId: r.clientId,
    clientName: r.client.name,
    staffUserId: r.staffUserId,
    staffName: r.staffUser?.name ?? null,
    lastMessageAt: r.lastMessageAt.toISOString(),
    unreadCount: unreadMap.get(r.id) ?? 0,
    preview: r.messages[0]?.body?.slice(0, 120) ?? null,
    isDemo: r.isDemo,
  }));
}

export async function loadConversationMessages(
  conversationId: string,
  viewer: AuthPayload,
  opts: { asClient: boolean; clientId?: string }
): Promise<{ conversation: PortalConversationDto; messages: PortalMessageDto[] } | null> {
  if (isDemoPortalSession(viewer) && opts.asClient) {
    const demo = demoConversations()[0];
    return {
      conversation: demo,
      messages: demoMessages(viewer.sub),
    };
  }

  const prisma = getPrisma();
  const row = await prisma.portalConversation.findUnique({
    where: { id: conversationId },
    include: {
      staffUser: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, userId: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!row || row.isDemo) return null;
  if (opts.asClient && opts.clientId && row.clientId !== opts.clientId) return null;

  const nameByUser = new Map<string, string>();
  if (row.client.userId) nameByUser.set(row.client.userId, row.client.name);
  if (row.staffUser) nameByUser.set(row.staffUser.id, row.staffUser.name);
  // Fill missing sender names
  const senderIds = [...new Set(row.messages.map((m) => m.senderUserId))];
  const users = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, name: true },
  });
  for (const u of users) nameByUser.set(u.id, u.name);

  const conversation: PortalConversationDto = {
    id: row.id,
    subject: row.subject,
    status: row.status,
    caseId: row.caseId,
    requestId: row.requestId,
    clientId: row.clientId,
    clientName: row.client.name,
    staffUserId: row.staffUserId,
    staffName: row.staffUser?.name ?? null,
    lastMessageAt: row.lastMessageAt.toISOString(),
    unreadCount: 0,
    preview: null,
    isDemo: row.isDemo,
  };

  const messages: PortalMessageDto[] = row.messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderUserId: m.senderUserId,
    senderRole: m.senderRole === "client" ? "client" : "staff",
    senderName: nameByUser.get(m.senderUserId) || (m.senderRole === "client" ? row.client.name : "المكتب"),
    body: m.body,
    attachmentName: m.attachmentName,
    attachmentUrl: m.attachmentUrl,
    attachmentMime: m.attachmentMime,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    isMine: m.senderUserId === viewer.sub,
  }));

  return { conversation, messages };
}

export async function markMessagesRead(conversationId: string, readerRole: "client" | "staff") {
  const prisma = getPrisma();
  const opposite = readerRole === "client" ? "staff" : "client";
  await prisma.portalMessage.updateMany({
    where: { conversationId, senderRole: opposite, readAt: null },
    data: { readAt: new Date() },
  });
}

function demoConversations(): PortalConversationDto[] {
  return [
    {
      id: "demo-conv-1",
      subject: "استفسار تجريبي عن القضية DEMO-2026/01",
      status: "مفتوحة",
      caseId: null,
      requestId: null,
      clientId: "demo-client-portal-record",
      clientName: "عميل تجريبي",
      staffUserId: null,
      staffName: "أحمد المحامي",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      preview: "هذه محادثة تجريبية للقراءة فقط.",
      isDemo: true,
    },
  ];
}

function demoMessages(viewerId: string): PortalMessageDto[] {
  const now = Date.now();
  return [
    {
      id: "demo-msg-1",
      conversationId: "demo-conv-1",
      senderUserId: viewerId,
      senderRole: "client",
      senderName: "عميل تجريبي",
      body: "مرحبًا، أود الاستفسار عن موعد الجلسة القادمة (بيانات تجريبية).",
      attachmentName: null,
      attachmentUrl: null,
      attachmentMime: null,
      readAt: new Date(now - 3600000).toISOString(),
      createdAt: new Date(now - 7200000).toISOString(),
      isMine: true,
    },
    {
      id: "demo-msg-2",
      conversationId: "demo-conv-1",
      senderUserId: "demo-staff",
      senderRole: "staff",
      senderName: "أحمد المحامي",
      body: "مرحبًا، الجلسة مجدولة في 12 نوفمبر 2026 — هذه رسالة تجريبية للقراءة فقط.",
      attachmentName: null,
      attachmentUrl: null,
      attachmentMime: null,
      readAt: null,
      createdAt: new Date(now - 3600000).toISOString(),
      isMine: false,
    },
  ];
}
