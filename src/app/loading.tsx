export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f9",
        color: "#64748b",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "3px solid #e2e8f0",
            borderTopColor: "#c3152a",
            animation: "spin-slow 0.9s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ fontWeight: 700 }}>جاري التحميل...</p>
      </div>
    </main>
  );
}
