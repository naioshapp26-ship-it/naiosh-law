import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import {
  HERO_MEDIA_MAX_BYTES,
  resolveHeroMediaKind,
  type HeroMediaKind,
} from "@/lib/hero-media";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
};

function uploadsRoot() {
  return path.join(process.cwd(), "public", "uploads", "hero");
}

export async function saveHeroMediaFile(file: File): Promise<{
  url: string;
  kind: HeroMediaKind;
  mimeType: string;
  size: number;
  fileName: string;
}> {
  if (file.size <= 0) throw new Error("الملف فارغ");
  if (file.size > HERO_MEDIA_MAX_BYTES) {
    throw new Error("حجم الملف كبير جداً — الحد الأقصى 100 ميجابايت");
  }

  const kind = resolveHeroMediaKind(file.type, file.name);
  if (!kind) {
    throw new Error("نوع الملف غير مدعوم — ارفع صورة أو فيديو");
  }

  const mimeType = file.type || (kind === "video" ? "video/mp4" : "image/jpeg");
  const ext =
    EXT_BY_MIME[mimeType] ||
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    (kind === "video" ? "mp4" : "jpg");

  const dir = uploadsRoot();
  await mkdir(dir, { recursive: true });

  const safeName = `hero-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const absPath = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  return {
    url: `/uploads/hero/${safeName}`,
    kind,
    mimeType,
    size: file.size,
    fileName: safeName,
  };
}

export async function deleteHeroMediaFile(publicUrl: string | null | undefined) {
  if (!publicUrl || !publicUrl.startsWith("/uploads/hero/")) return;
  const fileName = publicUrl.replace("/uploads/hero/", "").split("?")[0];
  if (!fileName || fileName.includes("..") || fileName.includes("/")) return;
  try {
    await unlink(path.join(uploadsRoot(), fileName));
  } catch {
    /* ignore missing file */
  }
}
