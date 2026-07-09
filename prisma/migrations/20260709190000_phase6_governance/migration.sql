-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('case_opening', 'fee_waiver', 'document_release', 'user_access', 'contract_signing', 'other');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('pending', 'signed', 'rejected', 'expired');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'info';
ALTER TABLE "AuditLog" ADD COLUMN "ipAddress" TEXT;

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL DEFAULT 'other',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requesterId" TEXT NOT NULL,
    "approverId" TEXT,
    "entity" TEXT,
    "entityId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'متوسط',
    "notes" TEXT,
    "requestedAt" TEXT NOT NULL,
    "resolvedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernancePolicy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'ساري',
    "effectiveDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ESignature" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentRef" TEXT,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT,
    "signerRole" TEXT,
    "userId" TEXT,
    "status" "SignatureStatus" NOT NULL DEFAULT 'pending',
    "signatureHash" TEXT,
    "signedAt" TEXT,
    "expiresAt" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ESignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRequest_refNo_key" ON "ApprovalRequest"("refNo");

-- CreateIndex
CREATE UNIQUE INDEX "ESignature_refNo_key" ON "ESignature"("refNo");

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ESignature" ADD CONSTRAINT "ESignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
