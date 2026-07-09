import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a12",
        padding: "1.5rem",
      }}
    >
      <section style={{ maxWidth: 520, textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.75rem" }}>
          الصفحة غير موجودة
        </h1>
        <p style={{ color: "#94a3b8", lineHeight: 1.8, marginBottom: "1.75rem" }}>
          الرابط المطلوب غير متاح أو تم نقله. يمكنك العودة إلى الصفحة الرئيسية أو لوحة التحكم.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn-primary">
            الصفحة الرئيسية
          </Link>
          <Link href="/app/dashboard" className="btn-ghost-dark">
            لوحة التحكم
          </Link>
        </div>
      </section>
    </main>
  );
}
