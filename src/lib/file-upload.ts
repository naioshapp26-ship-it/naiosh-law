export type FileAttachment = {
  name: string;
  mimeType: string;
  fileData: string;
  size: number;
};

/** جميع أنواع الملفات الشائعة: مستندات، صور، فيديو، صوت، أرشيف */
export const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.rtf," +
  ".jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.heic,.heif," +
  ".mp4,.webm,.mov,.avi,.mkv,.m4v,.wmv," +
  ".mp3,.wav,.ogg,.m4a," +
  ".zip,.rar,.7z";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

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
