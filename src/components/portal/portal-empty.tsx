"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function PortalEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="portal-empty" role="status" style={{ padding: "1.5rem 1rem", textAlign: "center" }}>
      <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "0.35rem" }}>{title}</strong>
      {description ? (
        <p style={{ margin: "0 auto 0.85rem", maxWidth: 420, color: "#526071", fontWeight: 600 }}>{description}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link className="portal-btn primary" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
      {children}
    </div>
  );
}

export function PortalLoadingCard({ label = "جاري التحميل…" }: { label?: string }) {
  return (
    <div className="portal-card" role="status" aria-live="polite">
      {label}
    </div>
  );
}

export function PortalErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const isSession = /جلسة|تسجيل الدخول|غير مصرح/i.test(message);
  return (
    <div className="portal-card" role="alert" style={{ borderColor: "rgba(185,28,28,.35)" }}>
      <p style={{ margin: 0, color: "#b91c1c", fontWeight: 700 }}>{message}</p>
      <div className="portal-actions" style={{ marginTop: "0.75rem" }}>
        {isSession ? (
          <Link className="portal-btn primary" href="/login">
            تسجيل الدخول مجددًا
          </Link>
        ) : null}
        {onRetry ? (
          <button type="button" className="portal-btn ghost" onClick={onRetry}>
            إعادة المحاولة
          </button>
        ) : null}
      </div>
    </div>
  );
}
