"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "2.5rem",
          maxWidth: 480,
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        }}
      >
        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</p>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 900, marginBottom: "0.5rem", color: "#0a0a12" }}>
          تعذر تحميل الصفحة
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.7 }}>
          حدث خطأ غير متوقع. جرّبي إعادة التحميل أو العودة للوحة التحكم.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            className="btn-primary"
            style={{ padding: "0.65rem 1.5rem" }}
          >
            إعادة التحميل
          </button>
          <Link
            href="/app/dashboard"
            style={{
              padding: "0.65rem 1.5rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              color: "#475569",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
