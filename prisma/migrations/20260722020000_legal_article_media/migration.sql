-- AlterTable
ALTER TABLE "LegalArticle" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "LegalArticle" ADD COLUMN IF NOT EXISTS "mediaKind" TEXT;
