import { NextResponse } from "next/server";
import { heroMediaResponse, readHeroMediaFile } from "@/lib/hero-media-server";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ file: string }> };

/** تقديم بنر/فيديو الهيرو المحفوظ على القرص (مع دعم Range) */
export async function GET(request: Request, { params }: Params) {
  const { file } = await params;
  const fileName = decodeURIComponent(file || "");
  const media = await readHeroMediaFile(fileName);
  if (!media) {
    return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
  }

  return heroMediaResponse(
    media.data,
    media.mimeType,
    request,
    "public, max-age=31536000, immutable"
  );
}
