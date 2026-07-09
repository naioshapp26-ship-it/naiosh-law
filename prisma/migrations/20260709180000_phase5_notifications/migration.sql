-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'sms', 'whatsapp', 'in_app');

-- CreateEnum
CREATE TYPE "NotificationProvider" AS ENUM ('resend', 'twilio', 'internal');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('email', 'sms', 'whatsapp', 'payment', 'webhook', 'other');

-- CreateTable
CREATE TABLE "OfficeBranch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "managerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'email',
    "audience" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "templateBody" TEXT,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "officeBranchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "provider" "NotificationProvider" NOT NULL DEFAULT 'internal',
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'مرسل',
    "errorMessage" TEXT,
    "officeBranchId" TEXT,
    "sentAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL DEFAULT 'other',
    "provider" TEXT NOT NULL,
    "endpoint" TEXT,
    "apiKeyMasked" TEXT,
    "config" TEXT,
    "callsToday" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "lastChecked" TEXT,
    "status" TEXT NOT NULL DEFAULT 'متصل',
    "officeBranchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "method" TEXT,
    "path" TEXT,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficeBranch_code_key" ON "OfficeBranch"("code");

-- AlterTable
ALTER TABLE "User" ADD COLUMN "officeBranchId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officeBranchId_fkey" FOREIGN KEY ("officeBranchId") REFERENCES "OfficeBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_officeBranchId_fkey" FOREIGN KEY ("officeBranchId") REFERENCES "OfficeBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "NotificationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_officeBranchId_fkey" FOREIGN KEY ("officeBranchId") REFERENCES "OfficeBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_officeBranchId_fkey" FOREIGN KEY ("officeBranchId") REFERENCES "OfficeBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
