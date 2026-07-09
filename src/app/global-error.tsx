"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootGlobalError({ error, reset }: Props) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f4f6f9" }}>
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            boxSizing: "border-box",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 560,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 24,
              boxShadow: "0 18px 60px rgba(15,23,42,0.12)",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0a0a12", margin: "0 0 0.5rem" }}>
              حدث خطأ في تحميل النظام
            </h1>
            <p style={{ color: "#64748b", lineHeight: 1.8, margin: "0 0 1.5rem" }}>
              تعذر تحميل الواجهة الأساسية. جرّب إعادة المحاولة، وإذا استمرت المشكلة أعد فتح النظام.
            </p>
            {error.digest ? (
              <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0 0 1rem" }}>
                رمز الخطأ: {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              onClick={reset}
              style={{
                border: "none",
                borderRadius: 12,
                background: "linear-gradient(135deg,#c3152a,#7f0d1a)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                fontWeight: 800,
                padding: "0.8rem 1.6rem",
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
