-- AlterTable
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "firstParty" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "firstPartyPhone" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "secondParty" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "secondPartyPhone" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "RecordParty" (
    "id" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceRef" TEXT,
    "firstParty" TEXT,
    "firstPartyPhone" TEXT,
    "secondParty" TEXT,
    "secondPartyPhone" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordParty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RecordParty_sourceModule_sourceId_key" ON "RecordParty"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RecordParty_sourceModule_idx" ON "RecordParty"("sourceModule");
