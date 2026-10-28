-- RecordParty: secondary mobiles
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "firstPartyPhoneSecondary" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "firstPartyPhoneSecondaryDialCode" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "secondPartyPhoneSecondary" TEXT;
ALTER TABLE "RecordParty" ADD COLUMN IF NOT EXISTS "secondPartyPhoneSecondaryDialCode" TEXT;

-- LegalClassificationEntry: client + party full contact (jurisdiction `country` unchanged)
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "clientPhone" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "clientPhoneDialCode" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "clientPhoneSecondary" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "clientPhoneSecondaryDialCode" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "clientCountry" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "clientCity" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "firstPartyDialCode" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "firstPartyCountry" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "firstPartyCity" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "firstPartyPhoneSecondary" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "firstPartyPhoneSecondaryDialCode" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "secondPartyDialCode" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "secondPartyCountry" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "secondPartyCity" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "secondPartyPhoneSecondary" TEXT;
ALTER TABLE "LegalClassificationEntry" ADD COLUMN IF NOT EXISTS "secondPartyPhoneSecondaryDialCode" TEXT;

-- Professional person contact
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "phoneDialCode" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "phoneSecondary" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "phoneSecondaryDialCode" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "city" TEXT;

-- CourtOfficial person contact (OfficialEntity remains org switchboard)
ALTER TABLE "CourtOfficial" ADD COLUMN IF NOT EXISTS "phoneDialCode" TEXT;
ALTER TABLE "CourtOfficial" ADD COLUMN IF NOT EXISTS "phoneSecondary" TEXT;
ALTER TABLE "CourtOfficial" ADD COLUMN IF NOT EXISTS "phoneSecondaryDialCode" TEXT;
ALTER TABLE "CourtOfficial" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "CourtOfficial" ADD COLUMN IF NOT EXISTS "city" TEXT;
