"use client";

import { useId, useRef, useState } from "react";
import {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_FILE_BYTES,
  attachmentFromMediaUrl,
  formatFileSize,
  guessMediaKindFromUrl,
  isRemoteMediaAttachment,
  readFileAsAttachment,
  type FileAttachment,
  type MediaUrlKind,
} from "@/lib/file-upload";

type Props = {
  value: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  label?: string;
  hint?: string;
  /** all = docs+images+videos · media = images+videos (articles) */
  mode?: "all" | "media";
  /** Show URL link input (default true) */
  enableUrl?: boolean;
};

type PickKind = "any" | "document" | "image" | "video";

const ALL_PICKERS: { kind: PickKind; accept: string; icon: string; title: string; desc: string }[] = [
  {
    kind: "document",
    accept: ACCEPTED_DOCUMENT_TYPES,
    icon: "📄",
    title: "ملف / شاهد",
    desc: "PDF · Word · Excel",
  },
  {
    kind: "image",
    accept: ACCEPTED_IMAGE_TYPES,
    icon: "🖼️",
    title: "صورة",
    desc: "JPG · PNG · WEBP",
  },
  {
    kind: "video",
    accept: ACCEPTED_VIDEO_TYPES,
    icon: "🎬",
    title: "فيديو",
    desc: "MP4 · MOV · WEBM",
  },
];

export function FileUploadField({
  value,
  onChange,
  label = "المرفقات من الكمبيوتر (ملف شاهد · صورة · فيديو)",
  hint,
  mode = "all",
  enableUrl = true,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultAccept = mode === "media" ? `${ACCEPTED_IMAGE_TYPES},${ACCEPTED_VIDEO_TYPES}` : ACCEPTED_FILE_TYPES;
  const [accept, setAccept] = useState(defaultAccept);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [urlKind, setUrlKind] = useState<MediaUrlKind | "auto">("auto");

  const pickers = mode === "media" ? ALL_PICKERS.filter((p) => p.kind !== "document") : ALL_PICKERS;
  const resolvedHint =
    hint ??
    (mode === "media"
      ? `ارفع صورة أو فيديو من الجهاز، أو الصق رابطًا مباشرًا — حتى ${formatFileSize(MAX_FILE_BYTES)} لكل ملف`
      : `اسحب الملفات هنا أو اختر من سطح المكتب — حتى ${formatFileSize(MAX_FILE_BYTES)} لكل ملف`);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || (files instanceof FileList ? files.length === 0 : files.length === 0)) return;
    setError("");
    setBusy(true);
    try {
      const next = [...value];
      const list = Array.from(files as ArrayLike<File>);
      for (const file of list) {
        if (mode === "media" && !file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          setError(`الملف ${file.name} ليس صورة أو فيديو`);
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          setError(`الملف ${file.name} أكبر من ${formatFileSize(MAX_FILE_BYTES)}`);
          continue;
        }
        const parsed = await readFileAsAttachment(file);
        if (parsed) next.push(parsed);
        else setError(`تعذر قراءة الملف ${file.name}`);
      }
      onChange(next);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openPicker = (kind: PickKind) => {
    const nextAccept =
      kind === "document"
        ? ACCEPTED_DOCUMENT_TYPES
        : kind === "image"
          ? ACCEPTED_IMAGE_TYPES
          : kind === "video"
            ? ACCEPTED_VIDEO_TYPES
            : mode === "media"
              ? `${ACCEPTED_IMAGE_TYPES},${ACCEPTED_VIDEO_TYPES}`
              : ACCEPTED_FILE_TYPES;
    setAccept(nextAccept);
    requestAnimationFrame(() => {
      inputRef.current?.click();
    });
  };

  const addFromUrl = () => {
    setError("");
    const kind = urlKind === "auto" ? guessMediaKindFromUrl(mediaUrl) : urlKind;
    const parsed = attachmentFromMediaUrl(mediaUrl, kind);
    if (!parsed) {
      setError("أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://");
      return;
    }
    if (value.some((a) => a.fileData === parsed.fileData)) {
      setError("هذا الرابط مضاف مسبقًا");
      return;
    }
    onChange([...value, parsed]);
    setMediaUrl("");
  };

  return (
    <div>
      <label className="input-label" htmlFor={inputId}>
        {label}
      </label>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `1.5px dashed ${dragging ? "#c3152a" : "#cbd5e1"}`,
          background: dragging ? "rgba(195,21,42,0.06)" : "#f8fafc",
          borderRadius: 14,
          padding: "0.9rem",
          transition: "border-color 0.15s ease, background 0.15s ease",
        }}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => void handleFiles(e.target.files)}
        />

        <p style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", margin: "0 0 0.55rem" }}>
          ① رفع مباشر من الجهاز
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${pickers.length}, minmax(0, 1fr))`,
            gap: "0.55rem",
            marginBottom: "0.65rem",
          }}
        >
          {pickers.map((p) => (
            <button
              key={p.kind}
              type="button"
              onClick={() => openPicker(p.kind)}
              disabled={busy}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "0.7rem 0.4rem",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: busy ? "wait" : "pointer",
                fontFamily: "inherit",
                color: "#0f172a",
              }}
            >
              <span style={{ fontSize: "1.15rem" }} aria-hidden>
                {p.icon}
              </span>
              <span style={{ fontSize: "0.78rem", fontWeight: 800 }}>{p.title}</span>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600 }}>{p.desc}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => openPicker(mode === "media" ? "any" : "any")}
          disabled={busy}
          style={{
            width: "100%",
            padding: "0.65rem 0.85rem",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: "#fff",
            cursor: busy ? "wait" : "pointer",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: "0.82rem",
            color: "#334155",
          }}
        >
          {busy
            ? "جاري رفع الملفات..."
            : mode === "media"
              ? "📁 اختيار صورة أو فيديو من سطح المكتب"
              : "📁 اختيار ملفات متعددة من سطح المكتب"}
        </button>

        {enableUrl && (
          <div
            style={{
              marginTop: "0.85rem",
              paddingTop: "0.85rem",
              borderTop: "1px dashed #e2e8f0",
            }}
          >
            <p style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", margin: "0 0 0.55rem" }}>
              ② إضافة عبر رابط (صورة أو فيديو)
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <select
                value={urlKind}
                onChange={(e) => setUrlKind(e.target.value as MediaUrlKind | "auto")}
                className="input-field"
                style={{ width: "auto", minWidth: 110, flex: "0 0 auto" }}
                aria-label="نوع الوسائط"
              >
                <option value="auto">تلقائي</option>
                <option value="image">صورة</option>
                <option value="video">فيديو</option>
              </select>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFromUrl();
                  }
                }}
                className="input-field"
                placeholder="https://example.com/photo.jpg أو رابط يوتيوب/فيديو"
                style={{ flex: "1 1 180px", minWidth: 0 }}
              />
              <button
                type="button"
                onClick={addFromUrl}
                style={{
                  padding: "0.65rem 1rem",
                  borderRadius: 10,
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                  color: "#9f1239",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  flex: "0 0 auto",
                }}
              >
                إضافة الرابط
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.55rem", marginBottom: 0 }}>{resolvedHint}</p>
      </div>

      {error && <p style={{ color: "#c3152a", fontSize: "0.78rem", marginTop: "0.45rem" }}>{error}</p>}

      {value.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {value.map((a, i) => {
            const remote = isRemoteMediaAttachment(a);
            const icon = a.mimeType.startsWith("video/")
              ? "🎬"
              : a.mimeType.startsWith("image/")
                ? "🖼️"
                : remote
                  ? "🔗"
                  : "📎";
            return (
              <div
                key={`${a.name}-${i}-${a.size}-${a.fileData.slice(0, 24)}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.55rem 0.75rem",
                  background: "#f8f9fb",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {icon} {a.name}{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                    {remote ? "(رابط)" : `(${formatFileSize(a.size)})`}
                  </span>
                  {remote && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.68rem",
                        color: "#64748b",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.fileData}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#c3152a",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  إزالة
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
