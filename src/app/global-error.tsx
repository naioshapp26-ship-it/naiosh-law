"use client";

/**
 * Minimal global error boundary — avoid providers/context during prerender.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "Cairo, sans-serif", padding: "2rem", background: "#F5F1E8", color: "#101D32" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>حدث خطأ غير متوقع</h1>
        <p style={{ marginTop: "0.75rem", color: "#526071" }}>{error?.message || "تعذر تحميل الصفحة"}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1.25rem",
            border: 0,
            borderRadius: "0.75rem",
            padding: "0.75rem 1.25rem",
            background: "#101D32",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
