"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8f9fb",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div className="card-white" style={{ width: "min(100%, 520px)", padding: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
          حدث خطأ غير متوقع
        </h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          {error.message || "تعذر تحميل هذه الصفحة. حاول مرة أخرى."}
        </p>
        <button type="button" onClick={reset} className="btn-primary">
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
