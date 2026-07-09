"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: Props) {
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
      <div className="card-white" style={{ maxWidth: 480, padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.6rem" }}>
          حدث خطأ غير متوقع
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          تعذر تحميل هذا الجزء من النظام. يمكنك إعادة المحاولة بدون فقدان الجلسة الحالية.
        </p>
        {error.digest && (
          <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "1rem" }}>
            رقم التتبع: {error.digest}
          </p>
        )}
        <button type="button" className="btn-primary" onClick={reset}>
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
