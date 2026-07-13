-- CreateTable
CREATE TABLE "ArchiveRecord" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceModule" TEXT NOT NULL,
    "sourceModuleLabel" TEXT,
    "sourceId" TEXT,
    "sourceRef" TEXT,
    "recordData" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'مؤرشف',
    "archivedBy" TEXT,
    "notes" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveRecord_refNo_key" ON "ArchiveRecord"("refNo");

-- CreateIndex
CREATE INDEX "ArchiveRecord_sourceModule_idx" ON "ArchiveRecord"("sourceModule");

-- CreateIndex
CREATE INDEX "ArchiveRecord_sourceId_idx" ON "ArchiveRecord"("sourceId");

-- CreateIndex
CREATE INDEX "ArchiveRecord_createdAt_idx" ON "ArchiveRecord"("createdAt");
