"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDialog({ open, title = "تأكيد الحذف", message, onConfirm, onCancel, loading }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const focusableSelector = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusFirst = () => panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    focusFirst();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onCancel, open]);

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
      }}
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card-white"
        style={{ maxWidth: 400, width: "90%", padding: "2rem", animation: "fade-in-up 0.2s ease" }}
        onClick={(e) => e.stopPropagation()}
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
        <div className="confirm-dialog-actions" style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onCancel}
            type="button"
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: "#f8f9fb",
              cursor: "pointer",
              fontFamily: "var(--font-cairo)",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "#475569",
            }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            type="button"
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "10px",
              border: "none",
              background: "#ef4444",
              cursor: "pointer",
              fontFamily: "var(--font-cairo)",
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#ffffff",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "جاري الحذف..." : "تأكيد الحذف"}
          </button>
        </div>
        <style>{`
          @media (max-width: 600px) {
            .confirm-dialog-actions {
              flex-direction: column-reverse !important;
            }
            .confirm-dialog-actions button {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
