import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import {
  DEFAULT_SITE_THEME,
  hasHeroBannerMedia,
  heroBannerPublicUrl,
  recordToTheme,
  type SiteTheme,
} from "@/lib/site-settings";
import { sanitizeMissingHeroUpload } from "@/lib/hero-media-server";

async function getOrCreateSettings() {
  let row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    row = await prisma.siteSettings.create({
      data: { id: "default", ...DEFAULT_SITE_THEME },
    });
  }
  return sanitizeMissingHeroUpload(row);
}

/** استجابة خفيفة للواجهة: بدون data URL الضخم + رابط عرض ثابت */
function toClientSettingsPayload(row: Awaited<ReturnType<typeof getOrCreateSettings>>) {
  const theme = recordToTheme(row);
  const hasBanner = hasHeroBannerMedia(theme);
  return {
    id: row.id,
    ...theme,
    // لا نرسل قاعدة/ميغابايتات base64 للمتصفح — العرض عبر /api/site-settings/hero-banner
    heroBannerData: null,
    heroBannerPath: hasBanner ? heroBannerPublicUrl(row.updatedAt) : null,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const row = await getOrCreateSettings();
  return NextResponse.json(toClientSettingsPayload(row));
}

export async function PUT(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  const data: Partial<SiteTheme> & { updatedBy?: string } = {};

  // وسائط الهيرو تُدار حصريًا عبر /api/site-settings/hero-media حتى لا يمسح الحفظ العام البنر
  const fields: (keyof SiteTheme)[] = [
    "primaryColor",
    "primaryDark",
    "accentColor",
    "sidebarFrom",
    "sidebarVia",
    "sidebarTo",
    "backgroundColor",
    "textColor",
    "brandName",
    "brandNameAr",
    "tagline",
    "logoPath",
    "logoData",
    "borderRadius",
  ];

  for (const key of fields) {
    if (body[key] !== undefined) {
      (data as Record<string, unknown>)[key] =
        body[key] === null ? null : String(body[key]);
    }
  }

  if (body.logoData === "") data.logoData = null;

  const updated = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_SITE_THEME, ...data, updatedBy: session!.email },
    update: { ...data, updatedBy: session!.email },
  });

  return NextResponse.json({
    ...toClientSettingsPayload(updated),
    message: "تم حفظ إعدادات النظام بنجاح",
  });
}

export async function DELETE() {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const updated = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_SITE_THEME, updatedBy: session!.email },
    update: {
      ...DEFAULT_SITE_THEME,
      logoData: null,
      heroBannerData: null,
      heroBannerPath: null,
      heroMediaKind: null,
      updatedBy: session!.email,
    },
  });

  return NextResponse.json({
    ...toClientSettingsPayload(updated),
    message: "تم استعادة الإعدادات الافتراضية",
  });
}
