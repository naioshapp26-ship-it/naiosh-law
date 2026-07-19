import { access, mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import {
  resolveHeroMediaKind,
  type HeroMediaKind,
} from "@/lib/hero-media";
import { prisma } from "@/lib/prisma";

/**
 * صور البنر تُحفظ دائماً في قاعدة البيانات (مثل الشعار) حتى تبقى بعد إعادة نشر Railway.
 * للفيديو الكبير نكتفي بالقرص إن تجاوز الحد.
 */
export const HERO_INLINE_IMAGE_MAX_BYTES = 25 * 1024 * 1024;
export const HERO_INLINE_VIDEO_MAX_BYTES = 8 * 1024 * 1024;

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

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
};

export function uploadsRoot() {
  return path.join(process.cwd(), ".data", "uploads", "hero");
}

export function heroMediaPublicUrl(fileName: string) {
  return `/api/uploads/hero/${fileName}`;
}

export function heroMediaMimeFromFileName(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

export function resolveHeroUploadFileName(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;
  if (publicUrl.startsWith("/api/uploads/hero/")) {
    return publicUrl.replace("/api/uploads/hero/", "").split("?")[0] || null;
  }
  // مسار قديم من public/uploads/hero
  if (publicUrl.startsWith("/uploads/hero/")) {
    return publicUrl.replace("/uploads/hero/", "").split("?")[0] || null;
  }
  return null;
}

export async function saveHeroMediaFile(file: File): Promise<{
  url: string;
  kind: HeroMediaKind;
  mimeType: string;
  size: number;
  fileName: string;
  inlineDataUrl: string | null;
}> {
  if (file.size <= 0) throw new Error("الملف فارغ");

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

  const canInlineImage = kind === "image" && file.size <= HERO_INLINE_IMAGE_MAX_BYTES;
  const canInlineVideo = kind === "video" && file.size <= HERO_INLINE_VIDEO_MAX_BYTES;
  const inlineDataUrl =
    canInlineImage || canInlineVideo
      ? `data:${mimeType};base64,${buffer.toString("base64")}`
      : null;

  return {
    url: heroMediaPublicUrl(safeName),
    kind,
    mimeType,
    size: file.size,
    fileName: safeName,
    inlineDataUrl,
  };
}

export async function readHeroMediaFile(fileName: string) {
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return null;
  }
  try {
    const absPath = path.join(uploadsRoot(), fileName);
    const data = await readFile(absPath);
    return { data, mimeType: heroMediaMimeFromFileName(fileName) };
  } catch {
    return null;
  }
}

/** استجابة بث/تحميل وسائط الهيرو مع دعم Range للفيديو حتى 100MB */
export function heroMediaResponse(
  data: Buffer,
  mimeType: string,
  request?: Request,
  cacheControl = "public, max-age=120, must-revalidate"
) {
  const total = data.byteLength;
  const range = request?.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : total - 1;
      if (
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        start >= 0 &&
        end >= start &&
        end < total
      ) {
        const chunk = data.subarray(start, end + 1);
        return new Response(new Uint8Array(chunk), {
          status: 206,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": String(chunk.byteLength),
            "Content-Range": `bytes ${start}-${end}/${total}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": cacheControl,
          },
        });
      }
    }
  }

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
      "Cache-Control": cacheControl,
    },
  });
}

/** رابط عرض دائم لمكتبة الهيرو — لا يعتمد على قرص مؤقت */
export function heroLibraryAssetUrl(
  id: string,
  cacheKey?: string | number | Date | null,
) {
  const base = `/api/homepage-hero-media/asset/${id}`;
  if (cacheKey == null || cacheKey === "") return base;
  const v =
    cacheKey instanceof Date
      ? cacheKey.getTime()
      : typeof cacheKey === "string" || typeof cacheKey === "number"
        ? cacheKey
        : String(cacheKey);
  return `${base}?v=${encodeURIComponent(String(v))}`;
}

export function toPublicHeroMediaItem<T extends {
  id: string;
  type: string;
  url: string;
  dataUrl?: string | null;
  title?: string | null;
  caption?: string | null;
  isActive: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}>(item: T) {
  return {
    id: item.id,
    type: item.type,
    url: heroLibraryAssetUrl(item.id, item.updatedAt),
    title: item.title,
    caption: item.caption,
    isActive: item.isActive,
    orderIndex: item.orderIndex,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    durable: Boolean(item.dataUrl?.trim()),
  };
}

export function parseHeroDataUrl(dataUrl: string): { mimeType: string; bytes: Buffer } | null {
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

export async function deleteHeroMediaFile(publicUrl: string | null | undefined) {
  const fileName = resolveHeroUploadFileName(publicUrl);
  if (!fileName) return;
  try {
    await unlink(path.join(uploadsRoot(), fileName));
  } catch {
    /* ignore missing file */
  }
}

async function localHeroUploadExists(publicUrl: string) {
  const fileName = resolveHeroUploadFileName(publicUrl);
  if (!fileName) {
    // رابط خارجي أو مسار غير محلي
    return !publicUrl.startsWith("/uploads/hero/") && !publicUrl.startsWith("/api/uploads/hero/");
  }
  try {
    await access(path.join(uploadsRoot(), fileName));
    return true;
  } catch {
    return false;
  }
}

/**
 * إذا كان مسار البنر المحلي مفقودًا بعد إعادة النشر، امسحه من الإعدادات
 * (مع الإبقاء على heroBannerData و heroMediaKind إن وُجدت بيانات دائمة).
 */
export async function sanitizeMissingHeroUpload<T extends {
  id: string;
  heroBannerPath: string | null;
  heroBannerData: string | null;
  heroMediaKind: string | null;
}>(row: T): Promise<T> {
  const pathValue = row.heroBannerPath?.trim() || null;
  if (!pathValue) return row;

  // لو عندنا data URL لا نمسحه بسبب مسار مكسور — فقط نظّف المسار المحلي المفقود
  if (row.heroBannerData?.trim()) {
    if (
      pathValue.startsWith("/uploads/hero/") ||
      pathValue.startsWith("/api/uploads/hero/")
    ) {
      const exists = await localHeroUploadExists(pathValue);
      if (!exists) {
        await prisma.siteSettings.update({
          where: { id: row.id },
          data: { heroBannerPath: null },
        });
        return { ...row, heroBannerPath: null };
      }
    }
    return row;
  }

  if (!pathValue.startsWith("/uploads/hero/") && !pathValue.startsWith("/api/uploads/hero/")) {
    return row;
  }

  const exists = await localHeroUploadExists(pathValue);
  if (exists) return row;

  // لا تمسح heroMediaKind إن كان المسار أصلاً يشير لمسار العرض الدائم
  if (pathValue.startsWith("/api/site-settings/hero-banner")) {
    return row;
  }

  // حاول إنقاذ البنر من مكتبة الهيرو قبل المسح
  const library = await prisma.homepageHeroMedia.findFirst({
    where: { OR: [{ url: pathValue }, { dataUrl: { not: null } }], isActive: true },
    orderBy: { updatedAt: "desc" },
  });
  if (library?.dataUrl?.trim()) {
    await prisma.siteSettings.update({
      where: { id: row.id },
      data: {
        heroBannerPath: null,
        heroBannerData: library.dataUrl,
        heroMediaKind: library.type || row.heroMediaKind,
      },
    });
    return {
      ...row,
      heroBannerPath: null,
      heroBannerData: library.dataUrl,
      heroMediaKind: library.type || row.heroMediaKind,
    };
  }

  await prisma.siteSettings.update({
    where: { id: row.id },
    data: {
      heroBannerPath: null,
      heroBannerData: null,
      heroMediaKind: null,
    },
  });

  return {
    ...row,
    heroBannerPath: null,
    heroBannerData: null,
    heroMediaKind: null,
  };
}
