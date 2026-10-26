-- Client portal 360: link users, profile fields, portal entities

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS /* noop keep */ "id" TEXT;
-- Client portal columns
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'ar';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "authorizedPerson" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "authorizedPhone" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "internalNo" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "linkedOffice" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "lawyerName" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "notificationPrefs" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "activityLog" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Client_userId_key" ON "Client"("userId");

DO $$ BEGIN
  ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ClientServiceRequest" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "refNo" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'جديد',
  "assignee" TEXT,
  "notes" TEXT,
  "lastUpdate" TEXT,
  "attachments" TEXT,
  "timeline" TEXT,
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientServiceRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClientServiceRequest_refNo_key" ON "ClientServiceRequest"("refNo");
CREATE INDEX IF NOT EXISTS "ClientServiceRequest_clientId_idx" ON "ClientServiceRequest"("clientId");
DO $$ BEGIN
  ALTER TABLE "ClientServiceRequest" ADD CONSTRAINT "ClientServiceRequest_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ClientPortalNotification" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'عام',
  "href" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientPortalNotification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ClientPortalNotification_clientId_idx" ON "ClientPortalNotification"("clientId");
DO $$ BEGIN
  ALTER TABLE "ClientPortalNotification" ADD CONSTRAINT "ClientPortalNotification_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ClientPortalDocument" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "caseId" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'عام',
  "fileName" TEXT,
  "fileUrl" TEXT,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'متاح',
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientPortalDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ClientPortalDocument_clientId_idx" ON "ClientPortalDocument"("clientId");
DO $$ BEGIN
  ALTER TABLE "ClientPortalDocument" ADD CONSTRAINT "ClientPortalDocument_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
CREATE INDEX IF NOT EXISTS "Consultation_clientId_idx" ON "Consultation"("clientId");
DO $$ BEGIN
  ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "FinancialRecord" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "FinancialRecord" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "FinancialRecord_clientId_idx" ON "FinancialRecord"("clientId");
DO $$ BEGIN
  ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
