import Link from "next/link";

export default function ModuleNotFound() {
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
      <section className="card-white" style={{ maxWidth: 520, padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
          الوحدة غير موجودة
        </h1>
        <p style={{ color: "#64748b", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          الرابط المطلوب غير معرّف ضمن وحدات النظام. يمكنك الرجوع إلى لوحة التحكم واختيار وحدة متاحة.
        </p>
        <Link href="/app/dashboard" className="btn-primary">
          العودة إلى لوحة التحكم
        </Link>
      </section>
    </main>
  );
}
