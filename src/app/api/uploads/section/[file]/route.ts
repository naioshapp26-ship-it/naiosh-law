import { NextResponse } from "next/server";
import { readFile, access } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type Params = { params: Promise<{ file: string }> };

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export async function GET(_request: Request, { params }: Params) {
  const { file } = await params;
  const fileName = decodeURIComponent(file || "");
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return NextResponse.json({ error: "غير صالح" }, { status: 400 });
  }
  const full = path.join(process.cwd(), ".data", "uploads", "section", fileName);
  try {
    await access(full);
    const data = await readFile(full);
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }
}
