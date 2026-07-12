-- Legal classification entries (8 axes international laws system)
CREATE TABLE "LegalClassificationEntry" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "axisSlug" TEXT NOT NULL,
    "topicSlug" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "country" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "clientName" TEXT,
    "effectiveDate" TEXT,
    "source" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalClassificationEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalClassificationEntry_refNo_key" ON "LegalClassificationEntry"("refNo");
CREATE INDEX "LegalClassificationEntry_axisSlug_idx" ON "LegalClassificationEntry"("axisSlug");
CREATE INDEX "LegalClassificationEntry_topicSlug_idx" ON "LegalClassificationEntry"("topicSlug");
