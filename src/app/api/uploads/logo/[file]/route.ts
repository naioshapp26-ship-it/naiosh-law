import { NextResponse } from "next/server";
import { readLogoMediaFile } from "@/lib/logo-media-server";

export const runtime = "nodejs";

type Params = { params: Promise<{ file: string }> };

/** تقديم ملف الشعار المرفوع من القرص */
export async function GET(_request: Request, { params }: Params) {
  const { file } = await params;
  const fileName = decodeURIComponent(file || "");
  const media = await readLogoMediaFile(fileName);
  if (!media) {
    return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(media.data), {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(media.data.byteLength),
    },
  });
}
