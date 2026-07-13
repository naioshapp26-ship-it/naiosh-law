-- CreateTable
CREATE TABLE "RecordSupplement" (
    "id" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceRef" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "attachments" TEXT,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecordSupplement_sourceModule_sourceId_idx" ON "RecordSupplement"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX "RecordSupplement_createdAt_idx" ON "RecordSupplement"("createdAt");
