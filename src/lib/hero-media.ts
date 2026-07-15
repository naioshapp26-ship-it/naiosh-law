export const LOGO_MAX_BYTES = 1_000_000; // 1000 KB
export const HERO_MEDIA_MAX_BYTES = 100 * 1024 * 1024; // 100 MB

export const HERO_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export const HERO_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-m4v",
]);

export type HeroMediaKind = "image" | "video";

export function resolveHeroMediaKind(mimeType: string, fileName = ""): HeroMediaKind | null {
  const mime = mimeType.toLowerCase();
  if (HERO_IMAGE_TYPES.has(mime) || mime.startsWith("image/")) return "image";
  if (HERO_VIDEO_TYPES.has(mime) || mime.startsWith("video/")) return "video";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  return null;
}

export function isHeroVideoSrc(src: string | null | undefined, kind?: string | null) {
  if (kind === "video") return true;
  if (kind === "image") return false;
  if (!src) return false;
  if (src.startsWith("data:video/")) return true;
  if (/\/api\/site-settings\/hero-banner(\?|$)/i.test(src)) return false;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
}
