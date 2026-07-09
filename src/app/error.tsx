"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f9",
        padding: "1.5rem",
      }}
    >
      <section className="card-white" style={{ maxWidth: 560, padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
          حدث خطأ غير متوقع
        </h1>
        <p style={{ color: "#64748b", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          تعذر تحميل الصفحة الحالية. جرّب إعادة المحاولة، وإذا استمرت المشكلة أعد فتح النظام.
        </p>
        {error.digest ? (
          <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "1rem" }}>
            رمز الخطأ: {error.digest}
          </p>
        ) : null}
        <button type="button" onClick={reset} className="btn-primary">
          إعادة المحاولة
        </button>
      </section>
    </main>
  );
}
