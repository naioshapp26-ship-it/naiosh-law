import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SITE_THEME } from "@/lib/site-settings";
import {
  heroMediaResponse,
  readHeroMediaFile,
  resolveHeroUploadFileName,
  sanitizeMissingHeroUpload,
} from "@/lib/hero-media-server";

export const runtime = "nodejs";
export const maxDuration = 300;

function parseDataUrl(dataUrl: string): { mimeType: string; bytes: Buffer } | null {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  try {
    return {
      mimeType: match[1] || "application/octet-stream",
      bytes: Buffer.from(match[2], "base64"),
    };
  } catch {
    return null;
  }
}

/** تقديم بنر/فيديو الهيرو الحالي من الملف أو من قاعدة البيانات (حتى 100MB) */
export async function GET(request: Request) {
  let row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    row = await prisma.siteSettings.create({
      data: { id: "default", ...DEFAULT_SITE_THEME },
    });
  }
  row = await sanitizeMissingHeroUpload(row);

  const pathValue = row.heroBannerPath?.trim() || null;
  const fileName = resolveHeroUploadFileName(pathValue);
  if (fileName) {
    const media = await readHeroMediaFile(fileName);
    if (media) {
      return heroMediaResponse(media.data, media.mimeType, request);
    }
  }

  const dataUrl = row.heroBannerData?.trim() || null;
  if (dataUrl) {
    const parsed = parseDataUrl(dataUrl);
    if (parsed) {
      return heroMediaResponse(parsed.bytes, parsed.mimeType, request);
    }
  }

  return NextResponse.json({ error: "لا يوجد بنر هيرو" }, { status: 404 });
}
