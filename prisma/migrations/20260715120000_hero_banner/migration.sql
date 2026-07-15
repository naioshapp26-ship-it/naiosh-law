-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroBannerPath" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroBannerData" TEXT;
