import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { DEFAULT_SITE_THEME, recordToTheme, type SiteTheme } from "@/lib/site-settings";

async function getOrCreateSettings() {
  let row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    row = await prisma.siteSettings.create({
      data: { id: "default", ...DEFAULT_SITE_THEME },
    });
  }
  return row;
}

export async function GET() {
  const row = await getOrCreateSettings();
  return NextResponse.json({
    id: row.id,
    ...recordToTheme(row),
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function PUT(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  const data: Partial<SiteTheme> & { updatedBy?: string } = {};

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
    "heroBannerPath",
    "heroBannerData",
    "borderRadius",
  ];

  for (const key of fields) {
    if (body[key] !== undefined) {
      (data as Record<string, unknown>)[key] =
        body[key] === null ? null : String(body[key]);
    }
  }

  if (body.logoData === "") data.logoData = null;
  if (body.heroBannerData === "") data.heroBannerData = null;
  if (body.heroBannerPath === "") data.heroBannerPath = null;

  const updated = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_SITE_THEME, ...data, updatedBy: session!.email },
    update: { ...data, updatedBy: session!.email },
  });

  return NextResponse.json({
    id: updated.id,
    ...recordToTheme(updated),
    updatedBy: updated.updatedBy,
    updatedAt: updated.updatedAt.toISOString(),
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
      updatedBy: session!.email,
    },
  });

  return NextResponse.json({
    id: updated.id,
    ...recordToTheme(updated),
    message: "تم استعادة الإعدادات الافتراضية",
  });
}
