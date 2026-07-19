-- ERP-style homepage / system settings extensions
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT NOT NULL DEFAULT '#fecaca';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "buttonColor" TEXT NOT NULL DEFAULT '#a00f20';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "headerBgColor" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "headingColor" TEXT NOT NULL DEFAULT '#0a0a12';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "paragraphColor" TEXT NOT NULL DEFAULT '#64748b';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "linkColor" TEXT NOT NULL DEFAULT '#1e3a8a';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroImageMode" TEXT NOT NULL DEFAULT 'cover';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroActiveType" TEXT NOT NULL DEFAULT 'image';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroOverlayStrength" INTEGER NOT NULL DEFAULT 62;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroAutoplaySlider" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroActiveImageCaption" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroActiveVideoCaption" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroActiveVideoDescription" TEXT;

CREATE TABLE IF NOT EXISTS "HomepageHeroMedia" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "caption" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomepageHeroMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HomepageSection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "link" TEXT,
  "iconClass" TEXT NOT NULL DEFAULT 'fas fa-square',
  "iconUrl" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HomepageHeroMedia_orderIndex_idx" ON "HomepageHeroMedia"("orderIndex");
CREATE INDEX IF NOT EXISTS "HomepageSection_orderIndex_idx" ON "HomepageSection"("orderIndex");
