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

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
  );
}

export function ConfirmDialog({ open, title = "تأكيد الحذف", message, onConfirm, onCancel, loading }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    getFocusableElements(dialogRef.current)[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
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
      className="confirm-dialog-backdrop"
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
        ref={dialogRef}
        className="card-white confirm-dialog-panel"
        style={{ maxWidth: 400, width: "100%", padding: "2rem", animation: "fade-in-up 0.2s ease" }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
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
        <h3 id="confirm-dialog-title" style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0a0a12", marginBottom: "0.5rem" }}>
          {title}
        </h3>
        <p id="confirm-dialog-message" style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.7, marginBottom: "1.75rem" }}>
          {message}
        </p>
        <div className="confirm-dialog-actions" style={{ display: "flex", gap: "0.75rem" }}>
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
      <style>{`
        @media (max-width: 480px) {
          .confirm-dialog-backdrop {
            align-items: flex-start !important;
            padding: 0.75rem !important;
            padding-top: calc(0.75rem + env(safe-area-inset-top)) !important;
          }
          .confirm-dialog-panel {
            border-radius: 16px !important;
            padding: 1.25rem !important;
          }
          .confirm-dialog-actions {
            flex-direction: column-reverse !important;
          }
        }
      `}</style>
    </div>
  );
}
