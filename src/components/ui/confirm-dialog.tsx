"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDialog({ open, title = "تأكيد الحذف", message, onConfirm, onCancel, loading }: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10,10,18,0.55)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="card-white"
        style={{ maxWidth: 400, width: "100%", padding: "2rem", animation: "fade-in-up 0.2s ease" }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            marginBottom: "1.25rem",
          }}
        >
          🗑️
        </div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0a0a12", marginBottom: "0.5rem" }}>
          {title}
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.7, marginBottom: "1.75rem" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: "#f8f9fb",
              cursor: "pointer",
              fontFamily: "var(--font)",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "#475569",
            }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "10px",
              border: "none",
              background: "#ef4444",
              cursor: "pointer",
              fontFamily: "var(--font)",
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#ffffff",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "جاري الحذف..." : "تأكيد الحذف"}
          </button>
        </div>
      </div>
    </div>
  );
}
