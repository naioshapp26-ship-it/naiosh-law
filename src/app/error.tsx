"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
      <section className="card-white" style={{ maxWidth: 520, width: "100%", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.75rem" }}>
          حدث خطأ غير متوقع
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          لم نتمكن من تحميل الصفحة بشكل صحيح. حاول مرة أخرى أو ارجع للوحة التحكم.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={reset} className="btn-primary">
            إعادة المحاولة
          </button>
          <a href="/app/dashboard" className="btn-ghost-dark" style={{ background: "#0a0a12", color: "#fff" }}>
            لوحة التحكم
          </a>
        </div>
      </section>
    </main>
  );
}
