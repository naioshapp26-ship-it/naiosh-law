import Link from "next/link";

export default function AppNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f9",
        padding: "1rem",
      }}
    >
      <div className="card-white" style={{ maxWidth: 460, padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.6rem" }}>
          الصفحة غير موجودة
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          الرابط المطلوب غير معرّف داخل النظام أو تم نقله.
        </p>
        <Link href="/app/dashboard" className="btn-primary">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
