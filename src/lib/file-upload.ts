export type FileAttachment = {
  name: string;
  mimeType: string;
  fileData: string;
  size: number;
};

export type MediaUrlKind = "image" | "video";

/** مستندات شائعة كشواهد ومستندات رسمية */
export const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.rtf,.zip,.rar,.7z";

/** صور من سطح المكتب / الكاميرا */
export const ACCEPTED_IMAGE_TYPES = ".jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.heic,.heif,image/*";

/** فيديو من سطح المكتب — مهم لقضايا التأمين والحوادث */
export const ACCEPTED_VIDEO_TYPES = ".mp4,.webm,.mov,.avi,.mkv,.m4v,.wmv,video/*";

/** جميع أنواع الملفات الشائعة: مستندات، صور، فيديو، صوت، أرشيف */
export const ACCEPTED_FILE_TYPES =
  ACCEPTED_DOCUMENT_TYPES +
  "," +
  ACCEPTED_IMAGE_TYPES +
  "," +
  ACCEPTED_VIDEO_TYPES +
  ",.mp3,.wav,.ogg,.m4a,audio/*";

/** حد موحّد مناسب لشواهد التأمين (صور/فيديو قصيرة ومستندات) */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function parseAttachments(raw: unknown): FileAttachment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as FileAttachment[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as FileAttachment[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function readFileAsAttachment(file: File): Promise<FileAttachment | null> {
  if (file.size > MAX_FILE_BYTES) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        fileData: String(reader.result ?? ""),
        size: file.size,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** True when attachment points to an http(s) media link instead of embedded file data. */
export function isRemoteMediaAttachment(a: FileAttachment) {
  return /^https?:\/\//i.test(a.fileData) && !a.fileData.startsWith("data:");
}

export function guessMediaKindFromUrl(url: string): MediaUrlKind {
  const clean = url.trim().toLowerCase().split(/[?#]/)[0] ?? "";
  if (
    /\.(mp4|webm|mov|m4v|avi|mkv|wmv)$/i.test(clean) ||
    /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/.test(clean)
  ) {
    return "video";
  }
  return "image";
}

/**
 * Build an attachment from a public image/video URL (no binary upload).
 * `fileData` stores the remote URL; size is 0.
 */
export function attachmentFromMediaUrl(
  url: string,
  kind?: MediaUrlKind
): FileAttachment | null {
  const trimmed = url.trim();
  if (!/^https?:\/\/\S+/i.test(trimmed)) return null;
  const resolved = kind ?? guessMediaKindFromUrl(trimmed);
  const pathName = trimmed.split(/[?#]/)[0] ?? trimmed;
  const rawName = pathName.split("/").filter(Boolean).pop() || (resolved === "video" ? "video" : "image");
  const name = rawName.includes(".") ? rawName : resolved === "video" ? `${rawName}.mp4` : `${rawName}.jpg`;
  return {
    name: decodeURIComponent(name),
    mimeType: resolved === "video" ? "video/url" : "image/url",
    fileData: trimmed,
    size: 0,
  };
}

export function mediaKindFromAttachment(a: FileAttachment): MediaUrlKind | null {
  if (a.mimeType.startsWith("video/") || a.mimeType === "video/url") return "video";
  if (a.mimeType.startsWith("image/") || a.mimeType === "image/url") return "image";
  if (isRemoteMediaAttachment(a)) return guessMediaKindFromUrl(a.fileData);
  return null;
}
