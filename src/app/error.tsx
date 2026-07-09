"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#f8f9fb",
        textAlign: "center",
      }}
    >
      <section className="card-white" style={{ maxWidth: 520, padding: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
          حدث خطأ غير متوقع
        </h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          تعذر تحميل الصفحة. حاول مرة أخرى، وإذا استمرت المشكلة أعد فتح النظام.
        </p>
        {error.digest && (
          <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "1rem" }}>
            رمز التتبع: {error.digest}
          </p>
        )}
        <button type="button" onClick={reset} className="btn-primary">
          إعادة المحاولة
        </button>
      </section>
    </main>
  );
}
