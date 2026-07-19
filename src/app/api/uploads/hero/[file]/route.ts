import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  heroMediaResponse,
  parseHeroDataUrl,
  readHeroMediaFile,
} from "@/lib/hero-media-server";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ file: string }> };

/** تقديم بنر/فيديو الهيرو — قرص أولاً ثم نسخة قاعدة البيانات المطابقة لاسم الملف */
export async function GET(request: Request, { params }: Params) {
  const { file } = await params;
  const fileName = decodeURIComponent(file || "");
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return NextResponse.json({ error: "اسم ملف غير صالح" }, { status: 400 });
  }

  const media = await readHeroMediaFile(fileName);
  if (media) {
    return heroMediaResponse(
      media.data,
      media.mimeType,
      request,
      "public, max-age=120, must-revalidate",
    );
  }

  const diskUrl = `/api/uploads/hero/${fileName}`;
  const item = await prisma.homepageHeroMedia.findFirst({
    where: {
      OR: [
        { url: diskUrl },
        { url: `/uploads/hero/${fileName}` },
        { url: { endsWith: fileName } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
  if (item?.dataUrl?.trim()) {
    const parsed = parseHeroDataUrl(item.dataUrl);
    if (parsed) {
      return heroMediaResponse(parsed.bytes, parsed.mimeType, request);
    }
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (settings?.heroBannerData?.trim()) {
    const parsed = parseHeroDataUrl(settings.heroBannerData);
    if (parsed) {
      return heroMediaResponse(parsed.bytes, parsed.mimeType, request);
    }
  }

  return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
}
