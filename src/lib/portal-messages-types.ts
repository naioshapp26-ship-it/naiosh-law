/** Client-safe messaging DTOs (no Prisma). */

export type PortalMessageDto = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderRole: "client" | "staff";
  senderName: string;
  body: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  attachmentMime: string | null;
  readAt: string | null;
  createdAt: string;
  isMine: boolean;
};

export type PortalConversationDto = {
  id: string;
  subject: string;
  status: string;
  caseId: string | null;
  requestId: string | null;
  clientId: string;
  clientName: string;
  staffUserId: string | null;
  staffName: string | null;
  lastMessageAt: string;
  unreadCount: number;
  preview: string | null;
  isDemo: boolean;
};
