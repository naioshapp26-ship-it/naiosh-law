-- Site-wide theme and branding settings (admin controlled)
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "primaryColor" TEXT NOT NULL DEFAULT '#c3152a',
    "primaryDark" TEXT NOT NULL DEFAULT '#a00f20',
    "accentColor" TEXT NOT NULL DEFAULT '#0ea5e9',
    "sidebarFrom" TEXT NOT NULL DEFAULT '#450a0a',
    "sidebarVia" TEXT NOT NULL DEFAULT '#7f1d1d',
    "sidebarTo" TEXT NOT NULL DEFAULT '#450a0a',
    "backgroundColor" TEXT NOT NULL DEFAULT '#f8fafc',
    "textColor" TEXT NOT NULL DEFAULT '#0a0a12',
    "brandName" TEXT NOT NULL DEFAULT 'NAIOSH Law',
    "brandNameAr" TEXT NOT NULL DEFAULT 'نايوش',
    "tagline" TEXT NOT NULL DEFAULT 'النظام القانوني السيادي 360',
    "logoPath" TEXT NOT NULL DEFAULT '/naiosh-logo.png',
    "logoData" TEXT,
    "borderRadius" TEXT NOT NULL DEFAULT '12',
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
