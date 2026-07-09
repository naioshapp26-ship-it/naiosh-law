-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'lawyer', 'consultant', 'judge', 'client', 'industrial_agent', 'employee');

-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('lawyer', 'consultant', 'judge');

-- CreateEnum
CREATE TYPE "NetworkRequestType" AS ENUM ('collaboration', 'case_referral', 'opinion_request');

-- CreateEnum
CREATE TYPE "NetworkRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'client',
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'فرد',
    "phone" TEXT,
    "email" TEXT,
    "nationalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "casesCount" INTEGER NOT NULL DEFAULT 0,
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseNo" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "court" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'نشطة',
    "nextDate" TEXT,
    "fees" TEXT,
    "notes" TEXT,
    "branchId" TEXT,
    "specializationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtSession" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "caseNo" TEXT,
    "client" TEXT,
    "court" TEXT NOT NULL,
    "room" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT,
    "type" TEXT NOT NULL DEFAULT 'جلسة',
    "status" TEXT NOT NULL DEFAULT 'مجدولة',
    "lawyer" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "branchId" TEXT,
    "specializationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'جديد',
    "lawyer" TEXT,
    "date" TEXT,
    "fees" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalBranch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalSpecialization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalSpecialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalSubject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerSpecialization" (
    "professionalId" TEXT NOT NULL,
    "specializationId" TEXT NOT NULL,

    CONSTRAINT "LawyerSpecialization_pkey" PRIMARY KEY ("professionalId","specializationId")
);

-- CreateTable
CREATE TABLE "CaseSubject" (
    "caseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "CaseSubject_pkey" PRIMARY KEY ("caseId","subjectId")
);

-- CreateTable
CREATE TABLE "SpecializationSubject" (
    "specializationId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "SpecializationSubject_pkey" PRIMARY KEY ("specializationId","subjectId")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ProfessionalType" NOT NULL DEFAULT 'lawyer',
    "licenseNo" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalNetwork" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "type" "NetworkRequestType" NOT NULL,
    "status" "NetworkRequestStatus" NOT NULL DEFAULT 'pending',
    "caseRef" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'جهة حكومية',
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtOfficial" (
    "id" TEXT NOT NULL,
    "entityId" TEXT,
    "professionalId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "court" TEXT,
    "chamber" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtOfficial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNo_key" ON "Case"("caseNo");

-- CreateIndex
CREATE UNIQUE INDEX "LegalBranch_name_key" ON "LegalBranch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LegalSpecialization_name_key" ON "LegalSpecialization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LegalSubject_name_key" ON "LegalSubject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourtOfficial_professionalId_key" ON "CourtOfficial"("professionalId");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "LegalBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "LegalSpecialization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtSession" ADD CONSTRAINT "CourtSession_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "LegalBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "LegalSpecialization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalSpecialization" ADD CONSTRAINT "LegalSpecialization_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "LegalBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerSpecialization" ADD CONSTRAINT "LawyerSpecialization_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerSpecialization" ADD CONSTRAINT "LawyerSpecialization_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "LegalSpecialization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSubject" ADD CONSTRAINT "CaseSubject_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSubject" ADD CONSTRAINT "CaseSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LegalSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializationSubject" ADD CONSTRAINT "SpecializationSubject_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "LegalSpecialization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecializationSubject" ADD CONSTRAINT "SpecializationSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LegalSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalNetwork" ADD CONSTRAINT "ProfessionalNetwork_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalNetwork" ADD CONSTRAINT "ProfessionalNetwork_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtOfficial" ADD CONSTRAINT "CourtOfficial_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "OfficialEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtOfficial" ADD CONSTRAINT "CourtOfficial_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
