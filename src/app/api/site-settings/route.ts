import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import {
  DEFAULT_SITE_THEME,
  hasCustomLogo,
  hasHeroBannerMedia,
  heroBannerPublicUrl,
  logoPublicUrl,
  recordToTheme,
  type SiteTheme,
} from "@/lib/site-settings";
import { sanitizeMissingHeroUpload } from "@/lib/hero-media-server";
import { deleteLogoMediaFile, isDefaultLogoPath } from "@/lib/logo-media-server";

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
  const customLogo = hasCustomLogo(theme);
  return {
    id: row.id,
    ...theme,
    logoData: null,
    logoPath: customLogo ? logoPublicUrl(row.updatedAt) : "",
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

  // الشعار ووسائط الهيرو تُدار عبر endpoints منفصلة حتى لا يُمسح الرفع عند الحفظ العام
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
    "borderRadius",
  ];

  for (const key of fields) {
    if (body[key] !== undefined) {
      (data as Record<string, unknown>)[key] =
        body[key] === null ? null : String(body[key]);
    }
  }

  // مسار شعار خارجي اختياري فقط (ليس رفع ملف / وليس الافتراضي القديم)
  if (typeof body.logoPath === "string") {
    const nextPath = body.logoPath.trim();
    if (!nextPath || isDefaultLogoPath(nextPath)) {
      // لا تُرجع للوجو الثابت من الحفظ العام
    } else if (
      !nextPath.startsWith("/api/site-settings/logo") &&
      !nextPath.startsWith("/api/uploads/logo/")
    ) {
      data.logoPath = nextPath;
      data.logoData = null;
    }
  }

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

  const current = await getOrCreateSettings();
  await deleteLogoMediaFile(current.logoPath);

  const updated = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_SITE_THEME, updatedBy: session!.email },
    update: {
      ...DEFAULT_SITE_THEME,
      logoPath: "",
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
