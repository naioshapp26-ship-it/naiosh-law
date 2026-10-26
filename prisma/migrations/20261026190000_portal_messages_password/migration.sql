-- Portal messaging + password reset / session invalidation fields

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
DO $$ BEGIN
  ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PortalConversation" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "staffUserId" TEXT,
  "subject" TEXT NOT NULL,
  "caseId" TEXT,
  "requestId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'مفتوحة',
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortalConversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PortalConversation_clientId_idx" ON "PortalConversation"("clientId");
CREATE INDEX IF NOT EXISTS "PortalConversation_staffUserId_idx" ON "PortalConversation"("staffUserId");
CREATE INDEX IF NOT EXISTS "PortalConversation_lastMessageAt_idx" ON "PortalConversation"("lastMessageAt");
DO $$ BEGIN
  ALTER TABLE "PortalConversation" ADD CONSTRAINT "PortalConversation_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PortalConversation" ADD CONSTRAINT "PortalConversation_staffUserId_fkey"
    FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PortalMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "attachmentName" TEXT,
  "attachmentUrl" TEXT,
  "attachmentMime" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortalMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PortalMessage_conversationId_createdAt_idx" ON "PortalMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "PortalMessage_senderUserId_idx" ON "PortalMessage"("senderUserId");
DO $$ BEGIN
  ALTER TABLE "PortalMessage" ADD CONSTRAINT "PortalMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "PortalConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
