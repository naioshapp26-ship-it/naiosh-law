CREATE TABLE "PageSettingVersion" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "scopeId" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL,
    "values" JSONB NOT NULL,
    "label" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageSettingVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecordCustomValue" (
    "id" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "valueText" TEXT,
    "valueJson" JSONB,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecordCustomValue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageSettingVersion_pageKey_createdAt_idx" ON "PageSettingVersion"("pageKey", "createdAt");
CREATE INDEX "PageSettingVersion_pageKey_scope_scopeId_idx" ON "PageSettingVersion"("pageKey", "scope", "scopeId");
CREATE INDEX "RecordCustomValue_sourceModule_sourceId_idx" ON "RecordCustomValue"("sourceModule", "sourceId");
CREATE INDEX "RecordCustomValue_fieldKey_idx" ON "RecordCustomValue"("fieldKey");
CREATE UNIQUE INDEX "RecordCustomValue_sourceModule_sourceId_fieldKey_key" ON "RecordCustomValue"("sourceModule", "sourceId", "fieldKey");
