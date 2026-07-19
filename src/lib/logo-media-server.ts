import { access, mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

/** الشعار الافتراضي القديم في public — يُستبدل عند الرفع */
export function isDefaultLogoPath(logoPath: string | null | undefined) {
  if (!logoPath?.trim()) return true;
  const raw = logoPath.trim().split("?")[0];
  return raw === "/naiosh-logo.png" || raw.endsWith("/naiosh-logo.png");
}

export function logoUploadsRoot() {
  return path.join(process.cwd(), ".data", "uploads", "logo");
}

export function logoMediaPublicUrl(fileName: string) {
  return `/api/uploads/logo/${fileName}`;
}

export function logoMediaMimeFromFileName(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

export function resolveLogoUploadFileName(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;
  if (publicUrl.startsWith("/api/uploads/logo/")) {
    return publicUrl.replace("/api/uploads/logo/", "").split("?")[0] || null;
  }
  if (publicUrl.startsWith("/uploads/logo/")) {
    return publicUrl.replace("/uploads/logo/", "").split("?")[0] || null;
  }
  return null;
}

export async function saveLogoMediaFile(file: File): Promise<{
  url: string;
  mimeType: string;
  size: number;
  fileName: string;
  buffer: Buffer;
}> {
  if (file.size <= 0) throw new Error("الملف فارغ");

  const mimeType = file.type || "image/png";
  if (!mimeType.startsWith("image/") && !/\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)) {
    throw new Error("ارفع صورة شعار (PNG / JPG / WebP / SVG)");
  }

  const ext =
    EXT_BY_MIME[mimeType] ||
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "png";

  const fileName = `logo-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const root = logoUploadsRoot();
  await mkdir(root, { recursive: true });
  const fullPath = path.join(root, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return {
    url: logoMediaPublicUrl(fileName),
    mimeType,
    size: file.size,
    fileName,
    buffer,
  };
}

export async function deleteLogoMediaFile(publicUrl: string | null | undefined) {
  const fileName = resolveLogoUploadFileName(publicUrl);
  if (!fileName) return;
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) return;
  try {
    await unlink(path.join(logoUploadsRoot(), fileName));
  } catch {
    // الملف قد يكون محذوفًا مسبقًا
  }
}

export async function readLogoMediaFile(fileName: string) {
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return null;
  }
  const fullPath = path.join(logoUploadsRoot(), fileName);
  try {
    await access(fullPath);
    const data = await readFile(fullPath);
    return { data, mimeType: logoMediaMimeFromFileName(fileName) };
  } catch {
    return null;
  }
}
