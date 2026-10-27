CREATE TABLE "ModuleRecord" (
    "id" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ModuleRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModuleRecord_moduleKey_createdAt_idx" ON "ModuleRecord"("moduleKey", "createdAt");
CREATE INDEX "ModuleRecord_moduleKey_status_idx" ON "ModuleRecord"("moduleKey", "status");
