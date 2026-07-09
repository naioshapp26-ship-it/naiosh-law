"use client";

import Link from "next/link";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f9", padding: "1rem" }}>
      <div className="card-white" style={{ width: "100%", maxWidth: 460, textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
          تعذر تحميل هذه الصفحة
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          حدث خطأ غير متوقع. يمكنك المحاولة مرة أخرى أو العودة إلى لوحة التحكم.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={reset} className="btn-primary" style={{ padding: "0.7rem 1.25rem" }}>
            إعادة المحاولة
          </button>
          <Link href="/app/dashboard" style={{ padding: "0.7rem 1.25rem", borderRadius: 10, border: "1px solid #e2e8f0", color: "#475569", textDecoration: "none", fontWeight: 700 }}>
            لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
