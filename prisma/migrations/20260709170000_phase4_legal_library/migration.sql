-- CreateEnum
CREATE TYPE "LibraryDocumentType" AS ENUM ('law', 'regulation', 'contract_template', 'court_form', 'memo_template', 'other');

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LibraryDocumentType" NOT NULL DEFAULT 'other',
    "category" TEXT,
    "branchId" TEXT,
    "specializationId" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "fileUrl" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'منشور',
    "publishedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "branchId" TEXT,
    "specializationId" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "tags" TEXT,
    "readMinutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'منشور',
    "publishedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircularInstruction" (
    "id" TEXT NOT NULL,
    "circularNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "branchId" TEXT,
    "issueDate" TEXT NOT NULL,
    "effectiveDate" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ساري',
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircularInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CircularInstruction_circularNo_key" ON "CircularInstruction"("circularNo");

-- AddForeignKey
ALTER TABLE "LegalDocument" ADD CONSTRAINT "LegalDocument_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "LegalBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDocument" ADD CONSTRAINT "LegalDocument_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "LegalSpecialization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalArticle" ADD CONSTRAINT "LegalArticle_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "LegalBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalArticle" ADD CONSTRAINT "LegalArticle_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "LegalSpecialization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircularInstruction" ADD CONSTRAINT "CircularInstruction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "LegalBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
