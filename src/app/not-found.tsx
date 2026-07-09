import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f9",
        padding: "2rem",
      }}
    >
      <section className="card-white" style={{ maxWidth: 520, padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h1 style={{ color: "#0a0a12", fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.6rem" }}>
          الصفحة غير موجودة
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          الرابط المطلوب غير متاح أو تم نقله. يمكنك العودة للصفحة الرئيسية أو لوحة التحكم.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn-primary" style={{ padding: "0.75rem 1.25rem" }}>
            الصفحة الرئيسية
          </Link>
          <Link href="/app/dashboard" className="btn-ghost-dark" style={{ padding: "0.75rem 1.25rem", color: "#0a0a12" }}>
            لوحة التحكم
          </Link>
        </div>
      </section>
    </main>
  );
}
