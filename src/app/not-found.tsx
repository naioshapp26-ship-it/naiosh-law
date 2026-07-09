import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f8f9fb 0%, #ffffff 100%)",
        padding: "2rem",
      }}
    >
      <section
        className="card-white"
        style={{
          width: "min(100%, 520px)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <p style={{ color: "#c3152a", fontSize: "0.78rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          404
        </p>
        <h1 style={{ color: "#0a0a12", fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.75rem" }}>
          الصفحة غير موجودة
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          الرابط المطلوب غير متاح أو تم نقله. يمكنك العودة للصفحة الرئيسية أو لوحة التحكم.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn-primary" style={{ padding: "0.75rem 1.25rem" }}>
            الصفحة الرئيسية
          </Link>
          <Link
            href="/app/dashboard"
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              color: "#475569",
              fontWeight: 700,
              padding: "0.75rem 1.25rem",
            }}
          >
            لوحة التحكم
          </Link>
        </div>
      </section>
    </main>
  );
}
