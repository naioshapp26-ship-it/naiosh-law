"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f9",
        padding: "1rem",
      }}
    >
      <section className="card-white" style={{ width: "100%", maxWidth: 460, padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
          حدث خطأ غير متوقع
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          تعذر تحميل الصفحة الحالية. حاول مرة أخرى، وإذا استمرت المشكلة يرجى مراجعة سجل النظام.
        </p>
        {error.digest && (
          <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginBottom: "1rem" }}>
            رمز الخطأ: {error.digest}
          </p>
        )}
        <button type="button" className="btn-primary" onClick={reset} style={{ padding: "0.75rem 1.5rem" }}>
          إعادة المحاولة
        </button>
      </section>
    </main>
  );
}
