-- CreateTable
CREATE TABLE "PageSetting" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "scopeId" TEXT NOT NULL DEFAULT '',
    "values" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSettingAudit" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageSettingAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageSetting_pageKey_idx" ON "PageSetting"("pageKey");
CREATE INDEX "PageSetting_scope_scopeId_idx" ON "PageSetting"("scope", "scopeId");
CREATE UNIQUE INDEX "PageSetting_pageKey_scope_scopeId_key" ON "PageSetting"("pageKey", "scope", "scopeId");
CREATE INDEX "PageSettingAudit_pageKey_createdAt_idx" ON "PageSettingAudit"("pageKey", "createdAt");
CREATE INDEX "PageSettingAudit_changedById_idx" ON "PageSettingAudit"("changedById");

ALTER TABLE "PageSetting" ADD CONSTRAINT "PageSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PageSettingAudit" ADD CONSTRAINT "PageSettingAudit_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
