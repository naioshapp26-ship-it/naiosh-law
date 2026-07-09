import Link from "next/link";

export default function NotFound() {
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
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
          الصفحة غير موجودة
        </h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          الرابط المطلوب غير متاح أو تم نقله.
        </p>
        <Link href="/" className="btn-primary">
          العودة للرئيسية
        </Link>
      </section>
    </main>
  );
}
