import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  heroMediaResponse,
  parseHeroDataUrl,
  readHeroMediaFile,
  resolveHeroUploadFileName,
} from "@/lib/hero-media-server";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ id: string }> };

/**
 * تقديم عنصر مكتبة الهيرو بشكل دائم:
 * ملف على القرص → dataUrl في قاعدة البيانات → بنر الإعدادات الاحتياطي
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });
  }

  const item = await prisma.homepageHeroMedia.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const fileName = resolveHeroUploadFileName(item.url);
  if (fileName) {
    const media = await readHeroMediaFile(fileName);
    if (media) {
      return heroMediaResponse(media.data, media.mimeType, request);
    }
  }

  if (item.dataUrl?.trim()) {
    const parsed = parseHeroDataUrl(item.dataUrl);
    if (parsed) {
      return heroMediaResponse(parsed.bytes, parsed.mimeType, request);
    }
  }

  // احتياطي: إن كان بنر الإعدادات الحالي بنفس النوع وله بيانات دائمة
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (settings?.heroBannerData?.trim()) {
    const parsed = parseHeroDataUrl(settings.heroBannerData);
    if (parsed) {
      // اشفِ العنصر تلقائياً من بيانات الإعدادات حتى لا يختفي لاحقاً
      if (!item.dataUrl?.trim()) {
        await prisma.homepageHeroMedia.update({
          where: { id: item.id },
          data: { dataUrl: settings.heroBannerData },
        }).catch(() => null);
      }
      return heroMediaResponse(parsed.bytes, parsed.mimeType, request);
    }
  }

  if (settings?.heroBannerPath?.trim()) {
    const settingsFile = resolveHeroUploadFileName(settings.heroBannerPath);
    if (settingsFile) {
      const media = await readHeroMediaFile(settingsFile);
      if (media) {
        return heroMediaResponse(media.data, media.mimeType, request);
      }
    }
  }

  return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
}
