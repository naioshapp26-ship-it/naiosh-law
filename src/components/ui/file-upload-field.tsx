"use client";

import { useState } from "react";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_BYTES,
  formatFileSize,
  readFileAsAttachment,
  type FileAttachment,
} from "@/lib/file-upload";

type Props = {
  value: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  label?: string;
  hint?: string;
};

export function FileUploadField({
  value,
  onChange,
  label = "المرفقات (مستندات، صور، فيديو، صوت)",
  hint = `يدعم PDF، Excel، Word، صور، فيديو، صوت — حتى ${formatFileSize(MAX_FILE_BYTES)} لكل ملف`,
}: Props) {
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const next = [...value];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setError(`الملف ${file.name} أكبر من ${formatFileSize(MAX_FILE_BYTES)}`);
        continue;
      }
      const parsed = await readFileAsAttachment(file);
      if (parsed) next.push(parsed);
    }
    onChange(next);
  };

  return (
    <div>
      <label className="input-label">{label}</label>
      <input
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        className="input-field"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.35rem" }}>{hint}</p>
      {error && <p style={{ color: "#c3152a", fontSize: "0.78rem", marginTop: "0.35rem" }}>{error}</p>}
      {value.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {value.map((a, i) => (
            <div
              key={`${a.name}-${i}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.55rem 0.75rem",
                background: "#f8f9fb",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {a.mimeType.startsWith("video/") ? "🎬" : a.mimeType.startsWith("image/") ? "🖼️" : "📎"}{" "}
                {a.name}{" "}
                <span style={{ color: "#94a3b8", fontWeight: 500 }}>({formatFileSize(a.size)})</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                style={{ background: "none", border: "none", color: "#c3152a", cursor: "pointer", fontSize: "0.75rem" }}
              >
                إزالة
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
