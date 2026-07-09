-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer', 'check', 'payment_gateway');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('court_summons', 'bail_deadline', 'document_submission', 'judgment_delivery', 'other');

-- CreateTable
CREATE TABLE "FeeRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caseType" TEXT,
    "specializationId" TEXT,
    "stage" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "fixedAmount" DOUBLE PRECISION,
    "percentRate" DOUBLE PRECISION,
    "minAmount" DOUBLE PRECISION,
    "maxAmount" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issueDate" TEXT NOT NULL,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'غير مسدد',
    "paymentMethod" "PaymentMethod",
    "caseRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "recordId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "reference" TEXT,
    "paidAt" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BailGuarantee" (
    "id" TEXT NOT NULL,
    "caseRef" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "court" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "depositDate" TEXT NOT NULL,
    "refundDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BailGuarantee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalGuarantee" (
    "id" TEXT NOT NULL,
    "caseRef" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "guarantorName" TEXT NOT NULL,
    "relationship" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ساري',
    "documents" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalGuarantee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialNotification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'other',
    "title" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "caseRef" TEXT,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'قيد المتابعة',
    "deliveryMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialRecord_invoiceNo_key" ON "FinancialRecord"("invoiceNo");

-- AddForeignKey
ALTER TABLE "FeeRule" ADD CONSTRAINT "FeeRule_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "LegalSpecialization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "FinancialRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
