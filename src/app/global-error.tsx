"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f4f6f9",
            padding: "1.5rem",
            fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
          }}
        >
          <section
            style={{
              maxWidth: 560,
              width: "100%",
              padding: "2rem",
              textAlign: "center",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 20,
              boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
              حدث خطأ غير متوقع
            </h1>
            <p style={{ color: "#64748b", lineHeight: 1.8, marginBottom: "1.5rem" }}>
              تعذر تحميل النظام. جرّب إعادة المحاولة، وإذا استمرت المشكلة أعد فتح الصفحة.
            </p>
            {error.digest ? (
              <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "1rem" }}>
                رمز الخطأ: {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#c3152a",
                color: "#fff",
                borderRadius: 12,
                padding: "0.875rem 2rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                border: "none",
                fontFamily: "inherit",
              }}
            >
              إعادة المحاولة
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
