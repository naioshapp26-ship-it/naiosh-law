-- Safe additive migration: person contact central fields
-- Does NOT delete existing rows or invent placeholder contact values.

-- Client: dial code + secondary phone/address + primary slots
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "phoneDialCode" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "phoneSecondary" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "phoneSecondaryDialCode" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "primaryPhoneSlot" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "countrySecondary" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "citySecondary" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "primaryAddressSlot" INTEGER NOT NULL DEFAULT 0;

-- RecordParty: country/city/dial for external parties (no fabricated fills)
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "firstPartyDialCode" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "firstPartyCountry" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "firstPartyCity" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "secondPartyDialCode" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "secondPartyCountry" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "secondPartyCity" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "firstPartyClientId" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "secondPartyClientId" TEXT;

-- Append-only contact change audit
CREATE TABLE IF NOT EXISTS "PersonContactChange" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT,
    "changedByName" TEXT,
    "sourceModule" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonContactChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PersonContactChange_clientId_createdAt_idx"
  ON "PersonContactChange"("clientId", "createdAt");

CREATE INDEX IF NOT EXISTS "PersonContactChange_sourceModule_sourceId_idx"
  ON "PersonContactChange"("sourceModule", "sourceId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PersonContactChange_clientId_fkey'
  ) THEN
    ALTER TABLE "PersonContactChange"
      ADD CONSTRAINT "PersonContactChange_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
